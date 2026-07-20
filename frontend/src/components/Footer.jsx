import { useState } from "react";
import { Link } from "react-router-dom";
import ContactModal from "./ContactModal";
import "./Footer.css";

// Section 5b. Social links are placeholders (href="#") until real accounts
// exist -- same spirit as the milestone placeholder data. Platform set
// (TikTok/Instagram/YouTube/X/Discord) matches Section 11's fuller channel
// list rather than About Us's narrower "shown on this page" subset (4d),
// since the Footer appears everywhere.
const SOCIAL_LINKS = [
  { label: "TikTok", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "YouTube", href: "#" },
  { label: "X", href: "#" },
  { label: "Discord", href: "#" },
];

export default function Footer() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <footer className="site-footer">
      <div className="site-footer__columns">
        <div className="site-footer__column">
          <button type="button" className="site-footer__link-button" onClick={() => setContactOpen(true)}>
            Contact us
          </button>
          <Link to="/terms">Terms of Service</Link>
        </div>

        <div className="site-footer__column site-footer__column--right">
          <Link to="/sponsorships">Sponsorship for businesses</Link>
          <div className="site-footer__socials">
            {SOCIAL_LINKS.map((s) => (
              <a key={s.label} href={s.href} aria-label={s.label}>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <p className="site-footer__oversight">
        Funds are held and managed by [LLC name — to be formed], with parental oversight.
      </p>
      <p className="site-footer__disclaimer">
        Formula Zany is not affiliated with, endorsed by, or sponsored by Formula 1, FIA, or
        Formula One Group in any way, shape, or form.
      </p>

      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </footer>
  );
}
