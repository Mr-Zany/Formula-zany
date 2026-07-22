import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CookieNotice.css";

const STORAGE_KEY = "fz-cookie-notice-dismissed";

// Section 29. Links to /terms (there's no separate Privacy Policy doc) and
// remembers dismissal in localStorage so it only shows once.
export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-notice" role="region" aria-label="Cookie notice">
      <p className="cookie-notice__text">
        We use cookies to keep you signed in and to remember referral links. See our{" "}
        <Link to="/terms">Terms of Service</Link> for details.
      </p>
      <div className="cookie-notice__actions">
        <button type="button" className="btn-secondary" onClick={dismiss}>
          Decline
        </button>
        <button type="button" className="btn-primary" onClick={dismiss}>
          Accept
        </button>
      </div>
    </div>
  );
}
