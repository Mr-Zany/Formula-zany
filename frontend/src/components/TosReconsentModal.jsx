import { useState } from "react";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import Modal from "./Modal";
import TermsContent from "./TermsContent";
import "../pages/TermsPage.css";
import "./TosReconsentModal.css";

// Section 5c: shown whenever the Terms materially changed since this user
// last agreed. No X, no Escape, no click-outside -- "Agree to Continue" or
// "Log Out Instead" are the only two ways out (Modal's dismissible=false).
export default function TosReconsentModal() {
  const { acceptTos, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleAgree() {
    setSubmitting(true);
    setError(null);
    try {
      await acceptTos();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={() => {}} labelledBy="tos-reconsent-title" dismissible={false}>
      <div className="tos-reconsent">
        <div className="tos-reconsent__banner">
          <strong id="tos-reconsent-title">Our Terms of Service have changed.</strong>
          <p>Please review the updated Terms below before continuing.</p>
        </div>

        {error && <div className="modal-message error">{error}</div>}

        <div className="tos-reconsent__scroll terms-page">
          <TermsContent />
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            data-testid="tos-logout-button"
            onClick={logout}
          >
            Log Out Instead
          </button>
          <button
            type="button"
            className="btn-primary"
            data-testid="tos-agree-button"
            disabled={submitting}
            onClick={handleAgree}
          >
            {submitting ? "Saving..." : "Agree to Continue"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
