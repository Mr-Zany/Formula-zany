import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch, ApiError } from "../api/client";
import { useNotifications } from "../notifications/NotificationContext";
import "../components/Modal.css";
import "./ResetPasswordPage.css";

// Section 6b: "styled consistently with the Sign Up/Log In modals" -- reuses
// the same visual language (Modal.css classes) as a standalone page, since
// this is where the emailed reset link actually lands, not a modal.
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { pushNotification } = useNotifications();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setExpired(false);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/auth/password-reset/confirm/", {
        method: "POST",
        body: { token, new_password: newPassword },
        auth: false,
      });
      setSuccess(true);
      pushNotification("password_reset_success");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      if (message.toLowerCase().includes("expired")) {
        setExpired(true);
        pushNotification("password_reset_expired");
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="reset-password-page">
      <div className="modal-panel reset-password-panel">
        <h2 className="modal-title">Reset your password</h2>

        {success ? (
          <div className="modal-message success">
            Password updated. You can now log in with your new password.
          </div>
        ) : expired ? (
          <div>
            <div className="modal-message error">
              This link has expired. Request a new one to reset your password.
            </div>
            <a href="/" className="btn-primary reset-password-home-link">
              Back to Home
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="modal-message error">{error}</div>}
            <div className="modal-field">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="modal-field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn-primary" disabled={submitting || !token}>
                {submitting ? "Updating..." : "Update password"}
              </button>
            </div>
            {!token && (
              <div className="modal-message error">
                This link is missing its token. Please use the link from your email.
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
