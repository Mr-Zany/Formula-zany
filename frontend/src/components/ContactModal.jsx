import { useState } from "react";
import { apiFetch, ApiError } from "../api/client";
import Modal from "./Modal";

export default function ContactModal({ onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/contact/", {
        method: "POST",
        body: { name, email, message },
        auth: false,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="contact-modal-title">
      <h2 className="modal-title" id="contact-modal-title">
        Contact us
      </h2>

      {success ? (
        <div className="modal-message success">Thanks — your message has been sent.</div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="modal-message error">{error}</div>}

          <div className="modal-field">
            <label htmlFor="contact-name">Name</label>
            <input id="contact-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="modal-field">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="modal-field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
