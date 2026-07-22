import { useState } from "react";
import { apiFetch, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useNotifications } from "../notifications/NotificationContext";
import Modal from "./Modal";
import PhotoEditor from "./PhotoEditor";
import "./ProfileSettingsModal.css";

export default function ProfileSettingsModal({ onClose }) {
  const { user, updateProfile, uploadProfilePhoto, logout } = useAuth();
  const { pushNotification } = useNotifications();

  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const [fullName, setFullName] = useState(user.full_name);
  const [fullNameMsg, setFullNameMsg] = useState(null);
  const [fullNameSaving, setFullNameSaving] = useState(false);

  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [showDisplayName, setShowDisplayName] = useState(
    user.name_display_pref === "display_name"
  );
  const [nameMsg, setNameMsg] = useState(null);
  const [nameSaving, setNameSaving] = useState(false);

  const [toggleMsg, setToggleMsg] = useState(null);

  const [changePwSubmitting, setChangePwSubmitting] = useState(false);
  const [changePwSent, setChangePwSent] = useState(false);
  const [changePwError, setChangePwError] = useState(null);

  async function handleSaveFullName(event) {
    event.preventDefault();
    setFullNameMsg(null);
    setFullNameSaving(true);
    // Note: the PRD's "Display name update" toast (13d) maps to the
    // separate display_name field/form below -- full_name is a field this
    // project added on top of the PRD (the 90-day real-name cooldown), so
    // it has no matching toast pool entry and stays inline-only here.
    try {
      await updateProfile({ full_name: fullName });
      setFullNameMsg({ type: "success", text: "Full name updated." });
    } catch (err) {
      setFullNameMsg({
        type: "error",
        text: err instanceof ApiError ? err.message : "Couldn't update your full name. Please try again.",
      });
    } finally {
      setFullNameSaving(false);
    }
  }

  async function handleSaveDisplayName(event) {
    event.preventDefault();
    setNameMsg(null);
    setNameSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        name_display_pref: showDisplayName ? "display_name" : "full_name",
      });
      setNameMsg({ type: "success", text: "Display name updated." });
      pushNotification("display_name_success");
    } catch (err) {
      setNameMsg({
        type: "error",
        text: err instanceof ApiError ? err.message : "Couldn't update your display name. Please try again.",
      });
      pushNotification("display_name_failed");
    } finally {
      setNameSaving(false);
    }
  }

  async function handleToggle(field, value) {
    setToggleMsg(null);
    try {
      await updateProfile({ [field]: value });
    } catch (err) {
      setToggleMsg({
        type: "error",
        text: err instanceof ApiError ? err.message : "Couldn't save that setting. Please try again.",
      });
    }
  }

  async function handleChangePassword() {
    setChangePwError(null);
    setChangePwSubmitting(true);
    try {
      // Reuses the existing public password-reset-by-email flow (same
      // endpoint AuthModal's "Forgot password" view calls) rather than a
      // new authenticated old-password-verification endpoint.
      await apiFetch("/auth/password-reset/", {
        method: "POST",
        body: { email: user.email },
        auth: false,
      });
      setChangePwSent(true);
    } catch (err) {
      setChangePwError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setChangePwSubmitting(false);
    }
  }

  function handleLogoutConfirmed() {
    logout();
    pushNotification("sign_out");
    onClose();
  }

  const avatarSrc = user.profile_picture_url;
  const initial = user.full_name?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <Modal onClose={onClose} labelledBy="profile-settings-title">
      <h2 className="modal-title" id="profile-settings-title">
        Profile Settings
      </h2>

      <div className="ps-avatar-row">
        <button
          type="button"
          className="ps-avatar"
          aria-label="Change profile picture"
          onClick={() => setPhotoEditorOpen(true)}
        >
          {avatarSrc ? <img src={avatarSrc} alt="" /> : <span>{initial}</span>}
          <span className="ps-avatar__hover" aria-hidden="true">
            {"\u{1F4F7}"}
          </span>
        </button>
      </div>

      <form onSubmit={handleSaveFullName} className="ps-section">
        <div className="modal-field">
          <label htmlFor="ps-full-name">Full name</label>
          <input
            id="ps-full-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        {user.full_name_change_notice && (
          <p className="ps-notice">{user.full_name_change_notice}</p>
        )}
        {fullNameMsg && <div className={`modal-message ${fullNameMsg.type}`}>{fullNameMsg.text}</div>}
        <button type="submit" className="btn-secondary" data-testid="save-full-name" disabled={fullNameSaving}>
          {fullNameSaving ? "Saving..." : "Save"}
        </button>
      </form>

      <form onSubmit={handleSaveDisplayName} className="ps-section">
        <div className="modal-field">
          <label htmlFor="ps-display-name">Display name</label>
          <input
            id="ps-display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <label className="modal-checkbox">
          <input
            type="checkbox"
            checked={showDisplayName}
            onChange={(e) => setShowDisplayName(e.target.checked)}
          />
          <span>Show display name (instead of full name)</span>
        </label>
        {nameMsg && <div className={`modal-message ${nameMsg.type}`}>{nameMsg.text}</div>}
        <button type="submit" className="btn-secondary" data-testid="save-display-name" disabled={nameSaving}>
          {nameSaving ? "Saving..." : "Save"}
        </button>
      </form>

      <div className="ps-section">
        <h3 className="ps-section__title">Notification settings</h3>
        {toggleMsg && <div className={`modal-message ${toggleMsg.type}`}>{toggleMsg.text}</div>}

        <label className="ps-toggle">
          <span>Disable live notifications</span>
          <input
            type="checkbox"
            checked={user.disable_live_notifications}
            disabled={user.disable_all_notifications}
            onChange={(e) => handleToggle("disable_live_notifications", e.target.checked)}
          />
          <span className="ps-toggle__track" aria-hidden="true" />
        </label>
        <label className="ps-toggle">
          <span>Disable away notifications</span>
          <input
            type="checkbox"
            checked={user.disable_away_notifications}
            disabled={user.disable_all_notifications}
            onChange={(e) => handleToggle("disable_away_notifications", e.target.checked)}
          />
          <span className="ps-toggle__track" aria-hidden="true" />
        </label>
        <label className="ps-toggle">
          <span>Disable all notifications</span>
          <input
            type="checkbox"
            checked={user.disable_all_notifications}
            onChange={(e) => handleToggle("disable_all_notifications", e.target.checked)}
          />
          <span className="ps-toggle__track" aria-hidden="true" />
        </label>

        <label className="ps-toggle">
          <span>Email me updates and personalized ranking notifications</span>
          <input
            type="checkbox"
            checked={user.newsletter_opt_in}
            onChange={(e) => handleToggle("newsletter_opt_in", e.target.checked)}
          />
          <span className="ps-toggle__track" aria-hidden="true" />
        </label>
      </div>

      <div className="ps-section">
        <h3 className="ps-section__title">Password</h3>
        {changePwError && <div className="modal-message error">{changePwError}</div>}
        {changePwSent ? (
          <div className="modal-message success">
            If an account exists for that email, a reset link has been sent.
          </div>
        ) : (
          <button
            type="button"
            className="btn-secondary"
            disabled={changePwSubmitting}
            onClick={handleChangePassword}
          >
            {changePwSubmitting ? "Sending..." : "Change Password"}
          </button>
        )}
      </div>

      <div className="ps-section ps-logout-row">
        <button type="button" className="btn-secondary" onClick={() => setLogoutConfirmOpen(true)}>
          Log out
        </button>
      </div>

      {photoEditorOpen && (
        <Modal onClose={() => setPhotoEditorOpen(false)} labelledBy="photo-editor-title">
          <PhotoEditor
            onCancel={() => setPhotoEditorOpen(false)}
            onSubmit={async (dataUrl) => {
              try {
                await uploadProfilePhoto(dataUrl);
                pushNotification("profile_picture_success");
                setPhotoEditorOpen(false);
              } catch (err) {
                pushNotification("profile_picture_failed");
                throw err;
              }
            }}
          />
        </Modal>
      )}

      {logoutConfirmOpen && (
        <Modal onClose={() => setLogoutConfirmOpen(false)} labelledBy="logout-confirm-title">
          <h3 id="logout-confirm-title">Are you sure you want to log out of your account?</h3>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setLogoutConfirmOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleLogoutConfirmed}>
              Confirm
            </button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
