import { useState } from "react";
import { apiFetch, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useNotifications } from "../notifications/NotificationContext";
import { getStoredReferralCode } from "../referral";
import Modal from "./Modal";
import AuthModal from "./AuthModal";
import "./DonateModal.css";

const PRESET_AMOUNTS = [5, 20, 75, 150];
const MIN_DOLLARS = 1;

export default function DonateModal({ onClose }) {
  const { user } = useAuth();
  const { pushNotification } = useNotifications();
  const [amountDollars, setAmountDollars] = useState(20);
  const [customAmount, setCustomAmount] = useState("");
  const [coverFee, setCoverFee] = useState(false);
  const [step, setStep] = useState("amount"); // "amount" | "anon-warning"
  const [tosChecked, setTosChecked] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const effectiveAmount = customAmount ? Number(customAmount) : amountDollars;
  const amountValid = effectiveAmount >= MIN_DOLLARS;

  async function submitDonation() {
    setError(null);
    setSubmitting(true);
    try {
      const data = await apiFetch("/donate/", {
        method: "POST",
        body: {
          amount_cents: Math.round(effectiveAmount * 100),
          cover_fee: coverFee,
          referral_code: getStoredReferralCode(),
        },
      });
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      // Section 9c: "fires alongside Stripe Checkout's own inline error" --
      // shown in addition to, not instead of, the inline message above.
      pushNotification("donation_failed");
      setSubmitting(false);
    }
  }

  function handleContinue() {
    if (!amountValid) return;
    if (user) {
      submitDonation();
    } else {
      setStep("anon-warning");
    }
  }

  if (authOpen) {
    return <AuthModal onClose={onClose} />;
  }

  return (
    <Modal onClose={onClose} labelledBy="donate-modal-title">
      {step === "amount" && (
        <div>
          <h2 className="modal-title" id="donate-modal-title">
            Donate
          </h2>
          {error && <div className="modal-message error">{error}</div>}

          <div className="donate-amounts">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                className={`donate-amount-chip ${!customAmount && amountDollars === amt ? "is-selected" : ""}`}
                onClick={() => {
                  setAmountDollars(amt);
                  setCustomAmount("");
                }}
              >
                ${amt}
              </button>
            ))}
          </div>

          <div className="modal-field">
            <label htmlFor="donate-custom-amount">Custom amount (USD)</label>
            <input
              id="donate-custom-amount"
              type="number"
              min={MIN_DOLLARS}
              step="0.01"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={`$${amountDollars}`}
            />
          </div>

          <label className="modal-checkbox">
            <input type="checkbox" checked={coverFee} onChange={(e) => setCoverFee(e.target.checked)} />
            <span>Cover the processing fee so 100% of my donation reaches the build</span>
          </label>

          {!amountValid && customAmount !== "" && (
            <div className="modal-message error">Minimum donation is $1.</div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={!amountValid || submitting}
              onClick={handleContinue}
            >
              {submitting ? "Loading..." : "Continue"}
            </button>
          </div>
        </div>
      )}

      {step === "anon-warning" && (
        <div>
          <h2 className="modal-title" id="donate-modal-title">
            You're about to donate without an account
          </h2>
          {error && <div className="modal-message error">{error}</div>}
          <p>
            This donation won't appear on the public leaderboard, and won't earn points, rank, or
            referral credit.
          </p>

          <label className="modal-checkbox">
            <input type="checkbox" checked={tosChecked} onChange={(e) => setTosChecked(e.target.checked)} />
            <span>
              I agree to the <a href="/terms">Terms of Service</a>
            </span>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setAuthOpen(true)}>
              Sign Up / Log In
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!tosChecked || submitting}
              onClick={submitDonation}
            >
              {submitting ? "Loading..." : "Donate Anonymously"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
