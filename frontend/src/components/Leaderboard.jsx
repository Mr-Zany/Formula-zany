import { useEffect, useMemo, useRef, useState } from "react";
import { pickRowMessage, unrankedMessage } from "../data/messagePools";
import "./Leaderboard.css";

const TIER_LABEL = { gold: "Gold", silver: "Silver", bronze: "Bronze", unranked: "Unranked" };
const TIER_ICON = { gold: "\u{1F947}", silver: "\u{1F948}", bronze: "\u{1F949}", unranked: "\u{2B50}" };

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
  { value: "points", label: "Points" },
  { value: "referrals", label: "Referrals" },
];

function formatDollars(cents) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Section 2c: single scrollable box, capped to 5 visible rows. Default view
// groups Gold -> Silver -> Bronze -> Unranked (each its own labeled
// section); the sort dropdown can override that with a flat re-sort or a
// single-tier slice.
export default function Leaderboard({ entries, loading, error }) {
  const [sort, setSort] = useState("default");
  const scrollRef = useRef(null);
  const rowRefs = useRef({});

  const groups = useMemo(() => {
    if (!entries) return [];
    if (sort === "default") {
      return ["gold", "silver", "bronze", "unranked"]
        .map((tier) => ({ tier, rows: entries.filter((e) => e.tier === tier) }))
        .filter((g) => g.rows.length > 0);
    }
    if (["gold", "silver", "bronze"].includes(sort)) {
      return [{ tier: sort, rows: entries.filter((e) => e.tier === sort) }];
    }
    const key = sort === "points" ? "points" : "referred_count";
    return [{ tier: null, rows: [...entries].sort((a, b) => b[key] - a[key]) }];
  }, [entries, sort]);

  const selfEntry = useMemo(() => entries?.find((e) => e.is_self), [entries]);

  useEffect(() => {
    if (!selfEntry) return;
    const node = rowRefs.current[selfEntry.user_id];
    if (node) node.scrollIntoView({ block: "center" });
  }, [selfEntry, sort]);

  if (loading) return <div className="leaderboard leaderboard--empty">Loading leaderboard...</div>;
  if (error) return <div className="leaderboard leaderboard--empty">Couldn't load the leaderboard. Please try again.</div>;
  if (!entries || entries.length === 0) {
    return <div className="leaderboard leaderboard--empty">No donors yet — be the first!</div>;
  }

  return (
    <div className="leaderboard-wrapper">
      <div className="leaderboard-sort">
        <label htmlFor="leaderboard-sort">Sort</label>
        <select id="leaderboard-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="leaderboard" ref={scrollRef}>
        {groups.every((g) => g.rows.length === 0) && (
          <div className="leaderboard__no-results">
            No {sort === "default" ? "" : TIER_LABEL[sort] || ""} donors in this view yet.
          </div>
        )}
        {groups.map((group) => (
          <div key={group.tier || "flat"}>
            {group.tier && sort === "default" && (
              <div className="leaderboard__group-heading">{TIER_LABEL[group.tier]}</div>
            )}
            {group.rows.map((entry) => (
              <Row
                key={entry.user_id}
                entry={entry}
                showMessage={sort === "default" || sort === entry.tier}
                setRef={(node) => {
                  rowRefs.current[entry.user_id] = node;
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ entry, showMessage, setRef }) {
  const initial = entry.name?.trim()?.[0]?.toUpperCase() || "?";
  const message = useMemo(() => {
    if (!showMessage) return null;
    if (entry.tier === "unranked") return unrankedMessage(entry.amount_to_bronze_cents);
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
      className={`leaderboard-row ${entry.is_self ? "is-self" : ""}`}
    >
      <div className="leaderboard-row__rank">
        <span aria-hidden="true">{TIER_ICON[entry.tier]}</span>
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
        {entry.is_self && entry.tier === "unranked" && (
          <div className="leaderboard-row__progress">
            <div
              className="leaderboard-row__progress-fill"
              style={{ width: `${Math.min(100, (1 - entry.amount_to_bronze_cents / 2000) * 100)}%` }}
            />
          </div>
        )}
        {entry.is_self && message && <div className="leaderboard-row__message">{message}</div>}
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
