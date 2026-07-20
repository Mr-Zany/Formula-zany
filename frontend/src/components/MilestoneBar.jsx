import MILESTONES from "../data/milestones";
import "./MilestoneBar.css";

function formatDollars(cents) {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

// Section 2c: progress bar with divider ticks, plus the single milestone
// currently being worked on underneath -- not every milestone, since the
// About Us page's Project Plan Stepper (4c) already walks through every
// build stage in full; repeating the whole list here would be redundant.
// Milestone amounts/descriptions are placeholders (see src/data/milestones.js)
// pending the real spec sheet -- structure and "fully funded" behavior are real.
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
  const currentMilestone = MILESTONES.find((m) => totalRaisedCents < m.thresholdCents);

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

          {currentMilestone && (
            <div className="milestone-bar__list">
              <div className="milestone-bar__item">
                <span className="milestone-bar__icon" aria-hidden="true">
                  {currentMilestone.icon}
                </span>
                <div>
                  <div className="milestone-bar__current-label">Current goal</div>
                  <div className="milestone-bar__item-label">
                    {currentMilestone.label} — {formatDollars(currentMilestone.thresholdCents)}
                  </div>
                  <div className="milestone-bar__item-status">{currentMilestone.status}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
