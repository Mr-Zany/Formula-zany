import { useState } from "react";
import PROJECT_PLAN from "../data/projectPlan";
import "./ProjectPlanStepper.css";

const CURRENT_ID = PROJECT_PLAN.find((t) => t.status === "current")?.id;

// Section 4c: straight vertical stepper (not a road/track visual -- that
// was explored and explicitly reverted). Current turn is auto-expanded;
// hovering any other turn expands it too, collapsing back on mouse leave.
export default function ProjectPlanStepper() {
  const [hoveredId, setHoveredId] = useState(null);
  const expandedId = hoveredId ?? CURRENT_ID;

  return (
    <ol className="stepper">
      {PROJECT_PLAN.map((turn) => {
        const expanded = turn.id === expandedId;
        return (
          <li
            key={turn.id}
            className={`stepper__turn stepper__turn--${turn.status} ${expanded ? "is-expanded" : ""}`}
            onMouseEnter={() => setHoveredId(turn.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="stepper__marker" aria-hidden="true" />
            <div className="stepper__content">
              <div className="stepper__heading">
                <span className="stepper__turn-label">Turn {turn.id}</span>
                <h3>{turn.title}</h3>
                {turn.status === "current" && <span className="stepper__badge">Current</span>}
                {turn.status === "done" && <span className="stepper__badge stepper__badge--done">Done</span>}
              </div>
              {expanded && <p className="stepper__body">{turn.body}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
