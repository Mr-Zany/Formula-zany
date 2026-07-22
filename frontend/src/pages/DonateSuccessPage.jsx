import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ShareModal from "../components/ShareModal";
import "./DonateSuccessPage.css";

// Section 20. Matches the `success_url` DonateView already generates, but
// stays unwired to real session/rank data -- that needs the Stripe webhook
// (still blocked), which is when this becomes a real post-payment
// destination instead of just a reachable, styled placeholder.
export default function DonateSuccessPage() {
  const { user } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="app-shell">
      <Header />
      <main className="donate-success-page">
        <div className="donate-success-page__card">
          <div className="donate-success-page__badge" aria-hidden="true">
            {"✓"}
          </div>
          <h1>Thank you</h1>
          <p>Your donation is on its way to becoming a real car.</p>
          <div className="donate-success-page__actions">
            {user?.referral_url && (
              <button type="button" className="btn-secondary" onClick={() => setShareOpen(true)}>
                Share
              </button>
            )}
            <Link to="/" className="btn-primary">
              Back to leaderboard
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      {shareOpen && <ShareModal referralUrl={user?.referral_url} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
