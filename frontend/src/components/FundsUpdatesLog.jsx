import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import "./FundsUpdatesLog.css";

// Section 4f: short admin-authored spending log, giving concrete substance
// to the public-accountability commitment made in the Terms of Service.
export default function FundsUpdatesLog() {
  const [updates, setUpdates] = useState(null);

  useEffect(() => {
    apiFetch("/content/funds-updates/", { auth: false })
      .then(setUpdates)
      .catch(() => setUpdates([]));
  }, []);

  if (updates === null) return null;
  if (updates.length === 0) {
    return <p className="funds-log__empty">No updates posted yet -- check back soon.</p>;
  }

  return (
    <ul className="funds-log">
      {updates.map((u) => (
        <li key={u.id} className="funds-log__item">
          <span className="funds-log__date">
            {new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span className="funds-log__text">{u.text}</span>
        </li>
      ))}
    </ul>
  );
}
