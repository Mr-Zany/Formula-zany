import { useState } from "react";
import Modal from "./Modal";
import "./ShareModal.css";

// Section 25. Copy is the only functional action here -- the IG/SMS icon
// buttons are decorative placeholders, same spirit as the Footer's
// href="#" social links, since no real IG/SMS deep-link integration exists.
export default function ShareModal({ referralUrl, onClose }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal onClose={onClose} labelledBy="share-modal-title">
      <h2 className="modal-title" id="share-modal-title">
        Share your link
      </h2>
      <p>Every friend who donates through your link earns you 5 points.</p>

      <div className="share-modal__link-row">
        <input type="text" readOnly value={referralUrl} />
        <button type="button" className="btn-primary" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="share-modal__icons">
        <button type="button" className="share-modal__icon-btn" aria-label="Share to Instagram">
          IG
        </button>
        <button type="button" className="share-modal__icon-btn" aria-label="Share via SMS">
          SMS
        </button>
      </div>
    </Modal>
  );
}
