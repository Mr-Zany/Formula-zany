import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthModal from "./AuthModal";
import ProfileSettingsModal from "./ProfileSettingsModal";
import "./Header.css";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about-us", label: "About Us" },
  { to: "/sponsorships", label: "Sponsorships" },
];

// Section 5a.
export default function Header() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const initial = user?.full_name?.trim()?.[0]?.toUpperCase() || "?";
  const avatarLabel = user
    ? `Open profile settings for ${user.display_name || user.full_name}`
    : undefined;

  return (
    <header className="site-header">
      <div className="site-header__nav">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={pathname === link.to ? "is-active" : undefined}
          >
            {link.label}
          </Link>
        ))}
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
