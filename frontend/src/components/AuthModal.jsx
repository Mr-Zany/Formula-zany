import { useState } from "react";
import { apiFetch, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import Modal from "./Modal";

const VIEWS = { LOGIN: "login", SIGNUP: "signup", FORGOT: "forgot" };

export default function AuthModal({ onClose }) {
  const [view, setView] = useState(VIEWS.LOGIN);

  return (
    <Modal onClose={onClose} labelledBy="auth-modal-title">
      {view === VIEWS.LOGIN && (
        <LoginView onClose={onClose} onSwitch={setView} />
      )}
      {view === VIEWS.SIGNUP && (
        <SignupView onClose={onClose} onSwitch={setView} />
      )}
      {view === VIEWS.FORGOT && (
        <ForgotPasswordView onSwitch={setView} />
      )}
    </Modal>
  );
}

function LoginView({ onClose, onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="modal-title" id="auth-modal-title">
        Log In
      </h2>
      {error && <div className="modal-message error">{error}</div>}

      <div className="modal-field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="modal-field">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="modal-link-row">
        <button type="button" data-testid="switch-to-forgot" onClick={() => onSwitch(VIEWS.FORGOT)}>
          Forgot password?
        </button>
      </div>

      <div className="modal-actions">
        <button type="submit" className="btn-primary" data-testid="login-submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Log In"}
        </button>
      </div>

      <div className="modal-link-row">
        Don't have an account?{" "}
        <button type="button" data-testid="switch-to-signup" onClick={() => onSwitch(VIEWS.SIGNUP)}>
          Sign Up
        </button>
      </div>
    </form>
  );
}

function SignupView({ onClose, onSwitch }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    display_name: "",
    profile_picture_url: "",
    tos_accepted: false,
    age_confirmed: false,
    newsletter_opt_in: false,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.display_name) delete payload.display_name;
      if (!payload.profile_picture_url) delete payload.profile_picture_url;
      await register(payload);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div>
        <h2 className="modal-title" id="auth-modal-title">
          Account created!
        </h2>
        <div className="modal-message success">
          Welcome to Formula Zany. Check your email to verify your address.
        </div>
      </div>
    );
  }

  const canSubmit = form.tos_accepted && form.age_confirmed && !submitting;

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="modal-title" id="auth-modal-title">
        Sign Up
      </h2>
      {error && <div className="modal-message error">{error}</div>}

      <div className="modal-field">
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          required
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </div>
      <div className="modal-field">
        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          required
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
      </div>
      <div className="modal-field">
        <label htmlFor="signup-full-name">Full name</label>
        <input
          id="signup-full-name"
          type="text"
          required
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
        />
      </div>
      <div className="modal-field">
        <label htmlFor="signup-display-name">Display name (optional)</label>
        <input
          id="signup-display-name"
          type="text"
          value={form.display_name}
          onChange={(e) => set("display_name", e.target.value)}
        />
      </div>
      <div className="modal-field">
        <label htmlFor="signup-photo-url">Profile picture URL (optional)</label>
        <input
          id="signup-photo-url"
          type="url"
          value={form.profile_picture_url}
          onChange={(e) => set("profile_picture_url", e.target.value)}
        />
      </div>

      <label className="modal-checkbox">
        <input
          type="checkbox"
          checked={form.tos_accepted}
          onChange={(e) => set("tos_accepted", e.target.checked)}
        />
        <span>
          I agree to the <a href="/terms">Terms of Service</a>
        </span>
      </label>
      <label className="modal-checkbox">
        <input
          type="checkbox"
          checked={form.age_confirmed}
          onChange={(e) => set("age_confirmed", e.target.checked)}
        />
        <span>I am 13 years of age or older</span>
      </label>
      <label className="modal-checkbox">
        <input
          type="checkbox"
          checked={form.newsletter_opt_in}
          onChange={(e) => set("newsletter_opt_in", e.target.checked)}
        />
        <span>Send me updates and personalized ranking notifications</span>
      </label>

      <div className="modal-actions">
        <button type="submit" className="btn-primary" data-testid="signup-submit" disabled={!canSubmit}>
          {submitting ? "Signing up..." : "Sign Up"}
        </button>
      </div>

      <div className="modal-link-row">
        Already have an account?{" "}
        <button type="button" data-testid="switch-to-login" onClick={() => onSwitch(VIEWS.LOGIN)}>
          Log In
        </button>
      </div>
    </form>
  );
}

function ForgotPasswordView({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/auth/password-reset/", {
        method: "POST",
        body: { email },
        auth: false,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="modal-title" id="auth-modal-title">
        Reset your password
      </h2>
      {error && <div className="modal-message error">{error}</div>}
      {sent ? (
        <div className="modal-message success">
          If an account exists for that email, a reset link has been sent.
        </div>
      ) : (
        <div className="modal-field">
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      )}

      {!sent && (
        <div className="modal-actions">
          <button type="submit" className="btn-primary" data-testid="forgot-submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </div>
      )}

      <div className="modal-link-row">
        <button type="button" data-testid="switch-to-login" onClick={() => onSwitch(VIEWS.LOGIN)}>
          Back to Log In
        </button>
      </div>
    </form>
  );
}
