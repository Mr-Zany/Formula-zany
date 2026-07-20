import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthModal from "./AuthModal";
import ProfileSettingsModal from "./ProfileSettingsModal";
import "./Header.css";

// Section 5a. About Us and Sponsorships are still ComingSoonPage
// placeholders (their real content is out of scope for this pass), but the
// routes themselves are real now.
export default function Header() {
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const initial = user?.full_name?.trim()?.[0]?.toUpperCase() || "?";
  const avatarLabel = user
    ? `Open profile settings for ${user.display_name || user.full_name}`
    : undefined;

  return (
    <header className="site-header">
      <div className="site-header__nav">
        <Link to="/">Home</Link>
        <Link to="/about-us">About Us</Link>
        <Link to="/sponsorships">Sponsorships</Link>
      </div>

      <div className="site-header__account">
        {loading ? null : user ? (
          <button
            type="button"
            className="avatar-button"
            aria-label={avatarLabel}
            data-testid="header-avatar-button"
            onClick={() => setProfileOpen(true)}
          >
            {user.profile_picture_url ? (
              <img src={user.profile_picture_url} alt="" className="avatar-image" />
            ) : (
              <span className="avatar-fallback">{initial}</span>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary login-button"
            data-testid="header-login-button"
            onClick={() => setAuthOpen(true)}
          >
            Log In / Sign Up
          </button>
        )}
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {profileOpen && <ProfileSettingsModal onClose={() => setProfileOpen(false)} />}
    </header>
  );
}
