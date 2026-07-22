import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useAuth } from "../auth/AuthContext";
import AuthModal from "./AuthModal";
import ShareModal from "./ShareModal";
import "./ReferralCard.css";

// Section 8. Visible to everyone, signed in or not -- a referral code only
// exists once someone has an account, and only activates once their email
// is verified. QR is generated client-side (the URL itself isn't secret,
// so there's no meaningful difference from generating it server-side per
// Section 8's suggestion -- this avoids a new backend dependency).
export default function ReferralCard() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const referralUrl = user?.referral_url;

  useEffect(() => {
    if (!referralUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(referralUrl, { width: 160, margin: 1 }).then(setQrDataUrl);
  }, [referralUrl]);

  async function handleCopy() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isUnverified = user && !user.email_verified;

  return (
    <div className={`referral-card ${isUnverified ? "referral-card--unverified" : ""}`}>
      <h3>{isUnverified ? "Verify to activate" : "Refer a friend"}</h3>

      {!user ? (
        <>
          <p>Sign up to get your own referral link and start earning points for every friend who donates.</p>
          <button type="button" className="btn-secondary" onClick={() => setAuthOpen(true)}>
            Sign Up
          </button>
        </>
      ) : isUnverified ? (
        <div className="referral-card__notice">
          Verify your email to activate your referral link and start earning points.
        </div>
      ) : (
        <>
          <p>Share your link -- you earn 5 points every time someone you refer actually donates.</p>
          <div className="referral-card__link-row">
            <input type="text" readOnly value={referralUrl} />
            <button type="button" className="btn-secondary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
          <button type="button" className="btn-primary referral-card__share-btn" onClick={() => setShareOpen(true)}>
            Share
          </button>
          {qrDataUrl && <img className="referral-card__qr" src={qrDataUrl} alt="QR code for your referral link" />}
        </>
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {shareOpen && <ShareModal referralUrl={referralUrl} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
