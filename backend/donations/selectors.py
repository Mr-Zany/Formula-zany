"""
Read-time computation of the public leaderboard: points, Rank (tier), and
Placement (numeric position) per PRD Section 2b and the "Derived" block of
Section 10b. Nothing here is persisted — it's recomputed on every call.

Kept as plain Python over an annotated queryset (rather than window-function
SQL) because at this project's expected scale (hundreds of donors, not
millions) that's simple to read, simple to get right, and fast enough
without caching.
"""

from dataclasses import dataclass

from django.db.models import Count, Sum

from accounts.models import Rank, User

BRONZE_FLOOR_CENTS = 2_000  # $20 (Section 2b)
ON_CAR_THRESHOLD_CENTS = 7_500  # $75 (Section 1 / 2d)
POINTS_PER_CENTS = 50  # $0.50 = 1 point (Section 2b)
POINTS_PER_REFERRAL = 5

GOLD_FIXED_SLOTS = 20
SILVER_FIXED_SLOTS = 80
BRONZE_FIXED_SLOTS = 80
FIXED_SLOT_THRESHOLD = 200  # below this many ranked users, slots are fixed not %-based


@dataclass
class LeaderboardEntry:
    user: User
    points: int
    total_donated_cents: int
    referred_count: int
    tier: str
    placement: int | None
    ahead_count: int | None
    percentile: int | None
    on_car: bool
    sponsor_tier: bool
    amount_to_bronze_cents: int


def compute_leaderboard() -> list[LeaderboardEntry]:
    """
    Ranked population = every User with points > 0, whether earned by
    donating or purely via confirmed referrals — a referral-only account is
    part of the pool same as a direct donor (2b: "referrals should
    genuinely matter"). This list is what the 200-donor threshold and the
    percentage bands are measured against.
    """
    users = User.objects.annotate(
        total_donated_cents=Sum("donations__amount_cents"),
        referred_count=Count("referrals", distinct=True),
    ).order_by("id")

    ranked = []
    for user in users:
        total_donated_cents = user.total_donated_cents or 0
        referred_count = user.referred_count
        points = (
            total_donated_cents // POINTS_PER_CENTS
        ) + referred_count * POINTS_PER_REFERRAL
        if points <= 0:
            continue
        ranked.append((user, points, total_donated_cents, referred_count))

    # Stable sort: ties keep the secondary `.order_by("id")` ordering above,
    # so placements don't flap between requests for tied point totals.
    ranked.sort(key=lambda row: row[1], reverse=True)

    n = len(ranked)
    if n == 0:
        return []

    if n < FIXED_SLOT_THRESHOLD:
        gold_cutoff = min(GOLD_FIXED_SLOTS, n)
        silver_cutoff = min(GOLD_FIXED_SLOTS + SILVER_FIXED_SLOTS, n)
        bronze_cutoff = min(GOLD_FIXED_SLOTS + SILVER_FIXED_SLOTS + BRONZE_FIXED_SLOTS, n)
    else:
        # floor division so N=200 lands exactly on 20/100/180 -- the
        # designed seamless handoff point between the two mechanics (2b).
        gold_cutoff = n * 10 // 100
        silver_cutoff = n * 50 // 100
        bronze_cutoff = n * 90 // 100

    entries: list[LeaderboardEntry] = []
    silver_rank = 0
    bronze_rank = 0
    silver_group_size = silver_cutoff - gold_cutoff

    for index, (user, points, total_donated_cents, referred_count) in enumerate(
        ranked, start=1
    ):
        # {percentile} means something different per tier in the Section 13
        # message pools: Gold's copy reads "top X%" (smaller = better,
        # measured over everyone), Silver/Bronze's reads "ahead of X% of
        # your tier" (bigger = better, measured within the tier group).
        if index <= gold_cutoff:
            tier = Rank.GOLD
            placement = index
            percentile = max(1, round(index / n * 100))
        elif index <= silver_cutoff:
            tier = Rank.SILVER
            silver_rank += 1
            placement = silver_rank
            percentile = (
                round((silver_group_size - silver_rank) / silver_group_size * 100)
                if silver_group_size
                else 0
            )
        elif index <= bronze_cutoff and total_donated_cents >= BRONZE_FLOOR_CENTS:
            tier = Rank.BRONZE
            bronze_rank += 1
            placement = bronze_rank
            percentile = None  # needs the final Bronze member count; filled in below
        else:
            # Either outside all fixed/percentage slots, or inside the
            # Bronze point-rank range but short of the $20 floor -- Bronze's
            # slots are not backfilled, so this donor is simply Unranked.
            tier = Rank.UNRANKED
            placement = None
            percentile = None

        entries.append(
            LeaderboardEntry(
                user=user,
                points=points,
                total_donated_cents=total_donated_cents,
                referred_count=referred_count,
                tier=tier,
                placement=placement,
                ahead_count=index - 1,
                percentile=percentile,
                on_car=total_donated_cents >= ON_CAR_THRESHOLD_CENTS,
                sponsor_tier=False,  # top 3 overall, filled in below
                amount_to_bronze_cents=max(0, BRONZE_FLOOR_CENTS - total_donated_cents),
            )
        )

    bronze_members = [e for e in entries if e.tier == Rank.BRONZE]
    bronze_total = len(bronze_members)
    for entry in bronze_members:
        entry.percentile = (
            round((bronze_total - entry.placement) / bronze_total * 100)
            if bronze_total
            else 0
        )

    for entry in entries[:3]:
        entry.sponsor_tier = True

    return entries


# Lower = better. Used to detect a genuine Rank *drop* (Gold -> Silver etc.),
# as opposed to a Placement shift within the same Rank, which the away check
# (Section 9b) deliberately ignores (Section 9c's live check is the more
# sensitive one that reacts to Placement alone).
RANK_ORDER = {Rank.GOLD: 0, Rank.SILVER: 1, Rank.BRONZE: 2, Rank.UNRANKED: 3}


def get_entry_for_user(user, entries=None):
    """Look up one user's LeaderboardEntry, or None if they're unranked/have no points."""
    entries = entries if entries is not None else compute_leaderboard()
    for entry in entries:
        if entry.user.id == user.id:
            return entry
    return None


def apply_rank_notification_flags(user, entry):
    """
    Section 9b/9c + 10b: notified_gold/notified_top3 track whether the
    celebratory notice has already fired for the *current* stay in that
    tier/spot -- flips true on the false->true edge (returned as
    just_reached_*), clears back to false the moment the user falls out, so
    a future re-entry celebrates again. Called from both the login check and
    every profile poll; idempotent by construction, so neither call site can
    double-fire it.
    """
    in_gold = entry is not None and entry.tier == Rank.GOLD
    in_top3 = entry is not None and entry.sponsor_tier

    just_reached_gold = in_gold and not user.notified_gold
    just_reached_top3 = in_top3 and not user.notified_top3

    changed_fields = []
    if user.notified_gold != in_gold:
        user.notified_gold = in_gold
        changed_fields.append("notified_gold")
    if user.notified_top3 != in_top3:
        user.notified_top3 = in_top3
        changed_fields.append("notified_top3")

    if changed_fields:
        user.save(update_fields=changed_fields)

    return just_reached_gold, just_reached_top3
