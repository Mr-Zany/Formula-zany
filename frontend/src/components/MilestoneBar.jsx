import MILESTONES from "../data/milestones";
import "./MilestoneBar.css";

function formatDollars(cents) {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

// Section 2c: progress bar with divider ticks, a small icon per milestone,
// and a one-line status underneath each. Milestone amounts/descriptions
// are placeholders (see src/data/milestones.js) pending the real spec
// sheet -- structure and "fully funded" behavior are real.
export default function MilestoneBar({ totalRaisedCents, fundingGoalCents, loading }) {
  if (loading || totalRaisedCents == null || fundingGoalCents == null) {
    return (
      <div className="milestone-bar milestone-bar--loading">
        <div className="milestone-bar__track" />
      </div>
    );
  }

  const fullyFunded = totalRaisedCents >= fundingGoalCents;
  const percent = Math.min(100, (totalRaisedCents / fundingGoalCents) * 100);

  return (
    <div className="milestone-bar">
      <div className="milestone-bar__totals">
        <strong>{formatDollars(totalRaisedCents)}</strong> raised of{" "}
        {formatDollars(fundingGoalCents)} goal
      </div>

      {fullyFunded ? (
        <div className="milestone-bar__fully-funded">
          Fully funded! Every dollar past this point is overflow support for the build.
        </div>
      ) : (
        <>
          <div className="milestone-bar__track">
            <div className="milestone-bar__fill" style={{ width: `${percent}%` }} />
            {MILESTONES.map((m) => {
              const tickPercent = Math.min(100, (m.thresholdCents / fundingGoalCents) * 100);
              const reached = totalRaisedCents >= m.thresholdCents;
              return (
                <div
                  key={m.label}
                  className={`milestone-bar__tick ${reached ? "is-reached" : ""}`}
                  style={{ left: `${tickPercent}%` }}
                  title={`${m.label} — ${formatDollars(m.thresholdCents)}`}
                />
              );
            })}
          </div>

          <div className="milestone-bar__list">
            {MILESTONES.map((m) => {
              const reached = totalRaisedCents >= m.thresholdCents;
              return (
                <div key={m.label} className={`milestone-bar__item ${reached ? "is-reached" : ""}`}>
                  <span className="milestone-bar__icon" aria-hidden="true">
                    {m.icon}
                  </span>
                  <div>
                    <div className="milestone-bar__item-label">
                      {m.label} — {formatDollars(m.thresholdCents)}
                    </div>
                    <div className="milestone-bar__item-status">{m.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
