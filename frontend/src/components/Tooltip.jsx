import { useId, useState } from "react";
import "./Tooltip.css";

// Section 21. Shop Black bubble, hover/focus-triggered. `children` is the
// trigger element (must accept aria-describedby); `label` is the tooltip
// text.
export default function Tooltip({ label, children }) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className="tooltip"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {typeof children === "function" ? children({ "aria-describedby": id }) : children}
      {visible && (
        <span className="tooltip__bubble" role="tooltip" id={id}>
          {label}
        </span>
      )}
    </span>
  );
}
