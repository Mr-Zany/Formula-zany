// Section 13a-13c, 13f (final message pools). 8 fixed + 4 variable lines
// per tier; a row randomly picks from tier messages + referral messages
// (if referred_count > 0) combined, no priority ordering (Section 13 intro).

const GOLD_FIXED = [
  "You didn't just donate — you're one of the reasons this build is possible.",
  "Every bolt on this car comes from donors like you.",
  "Thank you for supporting this ambitious project.",
  "You're basically part of the pit crew at this point.",
  "If this build had a hall of fame, you'd already be in it.",
  "You're not just watching this build — you're driving it.",
  "You're the reason this car will actually have wheels.",
  "The engineers thank you. The car thanks you. We thank you.",
];

const GOLD_VARIABLE = [
  ({ percentile }) => `You're in the top ${percentile}% of everyone backing this build. That's not small.`,
  ({ aheadCount }) => `Only ${aheadCount} people have given more than you — out of everyone.`,
  ({ rank }) => `You're ranked #${rank} overall. That's rare air.`,
  ({ rank }) => `Rank #${rank}. The car's going to remember this one.`,
];

const SILVER_FIXED = [
  "You're helping turn blueprints into an actual car.",
  "Silver looks good on you.",
  "You're not just watching this build — you're driving it.",
  "You're the reason this car will actually have wheels.",
  "Thank you for supporting this ambitious project.",
  "This car doesn't get built without the people with your generosity.",
  "You're not in the middle of the pack — you're part of the core.",
  "Silver isn't a stepping stone here. It's real support, full stop.",
];

const SILVER_VARIABLE = [
  ({ percentile }) => `You're ahead of ${percentile}% of Silver supporters — halfway to Gold.`,
  ({ rank }) => `#${rank} in Silver, and closing in.`,
  ({ percentile }) => `Top ${percentile}% of Silver. Solid ground to stand on.`,
  ({ rank }) => `Rank #${rank} in Silver — Gold's not that far off.`,
];

const BRONZE_FIXED = [
  "You didn't have to give anything, and you did. That means something.",
  "You're in the club now. The car club. Sort of.",
  "Officially on the board. Unofficially, kind of a big deal.",
  "You're proof this project isn't just an idea anymore.",
  "You're in — and honestly, that's the hardest part.",
  "This is where the build actually starts moving — and you're part of that.",
  "No donation here is a small one. This car needed you too.",
  "You showed up before most people even knew this was happening.",
];

const BRONZE_VARIABLE = [
  ({ percentile }) => `You're already ahead of ${percentile}% of Bronze donors.`,
  ({ rank }) => `You're #${rank} in Bronze — the board's watching you climb.`,
  ({ percentile }) => `Top ${percentile}% of Bronze — a real starting point.`,
  ({ rank }) => `Rank #${rank}, and this is exactly where momentum starts.`,
];

const REFERRAL_MESSAGES = [
  ({ referred }) => `You've brought ${referred} people into this with you — that's real momentum.`,
  ({ referred }) => `${referred} referrals and counting. This build has your fingerprints on it.`,
  ({ referred }) => `Because of you, ${referred} more people are part of this build.`,
  ({ referred }) => `${referred} referrals — the ripple effect is real.`,
];

const TIER_POOLS = {
  gold: { fixed: GOLD_FIXED, variable: GOLD_VARIABLE },
  silver: { fixed: SILVER_FIXED, variable: SILVER_VARIABLE },
  bronze: { fixed: BRONZE_FIXED, variable: BRONZE_VARIABLE },
};

export function pickRowMessage({ tier, percentile, placement, aheadCount, referredCount }) {
  const pool = TIER_POOLS[tier];
  if (!pool) return null;

  const vars = { percentile, rank: placement, aheadCount, referred: referredCount };
  const candidates = [...pool.fixed, ...pool.variable.map((fn) => fn(vars))];
  if (referredCount > 0) {
    candidates.push(...REFERRAL_MESSAGES.map((fn) => fn(vars)));
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function unrankedMessage(amountToBronzeCents) {
  const amount = (amountToBronzeCents / 100).toFixed(2).replace(/\.00$/, "");
  return `You're $${amount} away from Bronze — every donor started here.`;
}

// Section 13d-13g: the notification/toast message pools (Section 9). Wired
// but not yet reachable: DONATION_RECEIVED_UP/DONATION_RECEIVED_SAME need
// the Stripe webhook (Step 7) to know a donation just landed for the
// current user -- there's no trigger point for them until then.

const DONATION_RECEIVED_UP = [
  ({ spots, placement, tier }) =>
    `Nice! Your donation moved you up ${spots} spots. Now placed number ${placement}, ${tier}.`,
  ({ spots, placement, tier }) =>
    `That donation dive-bombed past ${spots} different drivers — you're now in ${placement}th place in ${tier}.`,
  ({ spots, placement, tier }) =>
    `Overtake mode activated, gaining you ${spots} spots! Placement #${placement}, ${tier}, and climbing.`,
];

const DONATION_RECEIVED_SAME = [
  () => "Donation received.",
  () => "We thank you for your donation.",
  ({ tier }) => `Donation confirmed. Your rank: ${tier}.`,
];

const LIVE_PLACEMENT_DROP = [
  () => "A rival's on your tail. Never mind, they passed you around turn three.",
  ({ placement }) => `Someone's active aero bumped you down to #${placement}.`,
  ({ placement }) => `Someone used their boost to pass you. You're now placed number ${placement}.`,
];

const LIVE_REFERRAL_TOAST = [
  () => "Recruitment successful. +5 referral points.",
  () => "One of yours just paid up. Nicely done. +5 referral points.",
  () => "Your number two driver showed up. +5 referral points.",
];

const AWAY_RANK_DROPPED = [
  ({ oldTier, newTier }) => `You got lapped while you were gone — dropped from ${oldTier} to ${newTier}.`,
  ({ newTier }) => `Someone put in a fast lap while you were away — you're in ${newTier} now.`,
  ({ oldTier, newTier }) => `You came back to find yourself off the podium — ${oldTier} to ${newTier}.`,
];

const REACHED_GOLD = [
  () => "You just reached Gold. Welcome to the top of the board.",
  () => "Gold. You earned it — literally.",
  () => "That donation just put you in Gold. Nice work.",
];

const REACHED_TOP3 = [
  () => "You're in the Top 3 now — one of the biggest reasons this car gets built.",
  () => "Top 3. Your sponsorship spot is locked in.",
  () => "You just broke into the Top 3. That's rare air.",
];

function pick(pool, vars) {
  const fn = pool[Math.floor(Math.random() * pool.length)];
  return fn(vars);
}

export function pickDonationReceivedUpMessage(vars) {
  return pick(DONATION_RECEIVED_UP, vars);
}

export function pickDonationReceivedSameMessage(vars) {
  return pick(DONATION_RECEIVED_SAME, vars);
}

export function pickLivePlacementDropMessage(vars) {
  return pick(LIVE_PLACEMENT_DROP, vars);
}

export function pickLiveReferralToastMessage() {
  return pick(LIVE_REFERRAL_TOAST, {});
}

export function pickAwayRankDroppedMessage(vars) {
  return pick(AWAY_RANK_DROPPED, vars);
}

export function pickReachedGoldMessage() {
  return pick(REACHED_GOLD, {});
}

export function pickReachedTop3Message() {
  return pick(REACHED_TOP3, {});
}

// Referral catch-up (login banner) reuses the same pool as the leaderboard
// row's referral messages (Section 13f: "also used for the login catch-up
// banner"), keyed to {referred}.
export function pickReferralCatchupMessage(count) {
  return REFERRAL_MESSAGES[Math.floor(Math.random() * REFERRAL_MESSAGES.length)]({
    referred: count,
  });
}

// Fixed single-line strings (Section 13d/13e) -- not pools, PRD gives exact text.
export const FIXED_MESSAGES = {
  profilePictureUpdateSuccess: "Profile picture updated.",
  profilePictureUpdateFailed: "Couldn't update your profile picture. Please try again.",
  displayNameUpdateSuccess: "Display name updated.",
  displayNameUpdateFailed: "Couldn't update your display name. Please try again.",
  passwordResetSuccess: "Password updated. You can now log in with your new password.",
  passwordResetExpired: "This link has expired. Request a new one to reset your password.",
  donationFailed: "Donation failed. Please try again.",
  accountCreated: "Account created! Welcome to Formula Zany.",
  signIn: "Welcome back.",
  signOut: "Signed out.",
  moderationTakedown:
    "Your display name or profile picture violated our Terms of Service and was removed by a moderator. Please upload something new, or contact us if you believe this was a mistake.",
};
