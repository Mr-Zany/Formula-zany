import { useEffect, useMemo, useRef, useState } from "react";
import { pickRowMessage, unrankedMessage } from "../data/messagePools";
import "./Leaderboard.css";

const TIER_LABEL = { gold: "Gold", silver: "Silver", bronze: "Bronze", unranked: "Unranked" };
const TIER_ICON = { gold: "\u{1F947}", silver: "\u{1F948}", bronze: "\u{1F949}", unranked: "\u{2B50}" };
const RANK_ORDER = { gold: 0, silver: 1, bronze: 2, unranked: 3 };
const PAGE_SIZE = 25;

const TIER_FILTERS = [
  { value: "all", label: "All" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
  { value: "unranked", label: "Unranked" },
];

const SORT_OPTIONS = [
  { value: "default", label: "Rank" },
  { value: "points", label: "Points" },
  { value: "referrals", label: "Referrals" },
];

function formatDollars(cents) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Section 2c + brand book sections 14/18/22/28/31/32: single scrollable
// box, capped to 5 visible rows, 25 rows per page (chip pagination). Chip
// filter/search/sort replaces the old plain <select>-only controls.
export default function Leaderboard({ entries, loading, error, onDonateClick }) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortMode, setSortMode] = useState("default");
  const [page, setPage] = useState(1);
  const [changedIds, setChangedIds] = useState(new Set());
  const scrollRef = useRef(null);
  const rowRefs = useRef({});
  const prevPlacements = useRef({});
  const changeTimer = useRef(null);

  const filtered = useMemo(() => {
    if (!entries) return [];
    let list = entries;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((e) => e.name?.toLowerCase().includes(q));
    if (tierFilter !== "all") list = list.filter((e) => e.tier === tierFilter);

    if (sortMode === "points") {
      list = [...list].sort((a, b) => b.points - a.points);
    } else if (sortMode === "referrals") {
      list = [...list].sort((a, b) => b.referred_count - a.referred_count);
    } else {
      list = [...list].sort(
        (a, b) => RANK_ORDER[a.tier] - RANK_ORDER[b.tier] || (a.placement ?? Infinity) - (b.placement ?? Infinity)
      );
    }
    return list;
  }, [entries, search, tierFilter, sortMode]);

  useEffect(() => {
    setPage(1);
  }, [search, tierFilter, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const showGroupHeadings = tierFilter === "all" && sortMode === "default";

  const selfEntry = useMemo(() => entries?.find((e) => e.is_self), [entries]);

  useEffect(() => {
    if (!selfEntry) return;
    const node = rowRefs.current[selfEntry.user_id];
    if (node) node.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfEntry, safePage]);

  // Live rank-change animation (brand book 31B): fires whenever a fresh
  // `entries` array arrives with placements that differ from the last one
  // we saw -- not a continuous poll, just a diff on whatever re-fetch
  // brought the new data (post-donation, manual refresh, etc).
  useEffect(() => {
    if (!entries) return;
    const prev = prevPlacements.current;
    const changed = new Set();
    entries.forEach((e) => {
      if (prev[e.user_id] !== undefined && prev[e.user_id] !== e.placement) {
        changed.add(e.user_id);
      }
    });
    const next = {};
    entries.forEach((e) => {
      next[e.user_id] = e.placement;
    });
    prevPlacements.current = next;

    if (changed.size > 0) {
      setChangedIds(changed);
      clearTimeout(changeTimer.current);
      changeTimer.current = setTimeout(() => setChangedIds(new Set()), 3400);
    }
    return () => clearTimeout(changeTimer.current);
  }, [entries]);

  if (loading) return <div className="leaderboard leaderboard--empty">Loading leaderboard...</div>;
  if (error) return <div className="leaderboard leaderboard--empty">Couldn't load the leaderboard. Please try again.</div>;
  if (!entries || entries.length === 0) {
    return (
      <div className="leaderboard leaderboard--empty leaderboard--dashed">
        <div className="leaderboard-empty__icon" aria-hidden="true">
          {"\u{1F3C1}"}
        </div>
        <div className="leaderboard-empty__headline">No donors yet</div>
        <p className="leaderboard-empty__body">Be the first name on the board.</p>
        {onDonateClick && (
          <button type="button" className="btn-primary" onClick={onDonateClick}>
            Be the first
          </button>
        )}
      </div>
    );
  }

  let lastTier = null;

  return (
    <div className="leaderboard-wrapper">
      <div className="leaderboard-controls">
        <input
          type="search"
          className="leaderboard-search"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search leaderboard by name"
        />

        <div className="leaderboard-tabs" role="tablist" aria-label="Filter by tier">
          {TIER_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={tierFilter === f.value}
              className={`leaderboard-tab leaderboard-tab--${f.value} ${tierFilter === f.value ? "is-active" : ""}`}
              onClick={() => setTierFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          className="leaderboard-sort-select"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          aria-label="Sort leaderboard"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="leaderboard" ref={scrollRef}>
        {pageRows.length === 0 && (
          <div className="leaderboard__no-results">No donors match this view yet.</div>
        )}
        {pageRows.map((entry) => {
          const heading =
            showGroupHeadings && entry.tier !== lastTier ? TIER_LABEL[entry.tier] : null;
          lastTier = entry.tier;
          return (
            <div key={entry.user_id}>
              {heading && <div className="leaderboard__group-heading">{heading}</div>}
              <Row
                entry={entry}
                showMessage={sortMode === "default" || sortMode === entry.tier}
                changed={changedIds.has(entry.user_id)}
                setRef={(node) => {
                  rowRefs.current[entry.user_id] = node;
                }}
              />
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
      )}
    </div>
  );
}

function pageNumbers(page, totalPages) {
  const nums = new Set([1, totalPages, page, page - 1, page + 1]);
  return [...nums].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
}

function Pagination({ page, totalPages, onChange }) {
  const nums = pageNumbers(page, totalPages);
  let lastRendered = 0;

  return (
    <div className="leaderboard-pagination" role="navigation" aria-label="Leaderboard pages">
      <button
        type="button"
        className="leaderboard-page-chip"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        {"‹"}
      </button>
      {nums.map((n) => {
        const showEllipsis = n - lastRendered > 1;
        lastRendered = n;
        return (
          <span key={n} style={{ display: "contents" }}>
            {showEllipsis && <span className="leaderboard-page-ellipsis">…</span>}
            <button
              type="button"
              className={`leaderboard-page-chip ${n === page ? "is-active" : ""}`}
              onClick={() => onChange(n)}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </button>
          </span>
        );
      })}
      <button
        type="button"
        className="leaderboard-page-chip"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        {"›"}
      </button>
    </div>
  );
}

function Row({ entry, showMessage, changed, setRef }) {
  const initial = entry.name?.trim()?.[0]?.toUpperCase() || "?";
  const isUnranked = entry.tier === "unranked";
  const message = useMemo(() => {
    if (!showMessage || !entry.is_self) return null;
    if (isUnranked) return unrankedMessage(entry.amount_to_bronze_cents);
    return pickRowMessage({
      tier: entry.tier,
      percentile: entry.percentile,
      placement: entry.placement,
      aheadCount: entry.ahead_count,
      referredCount: entry.referred_count,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.user_id]);

  return (
    <div
      ref={setRef}
      className={`leaderboard-row ${entry.is_self ? "is-self" : ""} ${changed ? "fz-rank-pop fz-rank-flash" : ""}`}
    >
      <div className="leaderboard-row__rank">
        {isUnranked ? (
          <span className="leaderboard-row__unranked-dot" aria-hidden="true" />
        ) : (
          <span aria-hidden="true">{TIER_ICON[entry.tier]}</span>
        )}
        {entry.placement && <span className="leaderboard-row__placement">#{entry.placement}</span>}
      </div>

      <div className="leaderboard-row__avatar">
        {entry.profile_picture_url ? (
          <img src={entry.profile_picture_url} alt="" />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      <div className="leaderboard-row__name-block">
        <div className="leaderboard-row__name">
          {entry.name}
          {entry.sponsor_tier && <span className="leaderboard-badge leaderboard-badge--sponsor">Top 3</span>}
          {entry.on_car && <span className="leaderboard-badge leaderboard-badge--car">On the car</span>}
        </div>
        <div className="leaderboard-row__points">{entry.points} points</div>
        {isUnranked && (
          <div className="leaderboard-row__progress">
            <div
              className="leaderboard-row__progress-fill"
              style={{ width: `${Math.min(100, (1 - entry.amount_to_bronze_cents / 2000) * 100)}%` }}
            />
          </div>
        )}
        {message && <div className="leaderboard-row__message">{message}</div>}
      </div>

      <div className="leaderboard-row__stats">
        {entry.referred_count > 0 && (
          <div className="leaderboard-row__referred">{entry.referred_count} referred</div>
        )}
        <div className="leaderboard-row__amount">{formatDollars(entry.total_donated_cents)}</div>
      </div>
    </div>
  );
}
