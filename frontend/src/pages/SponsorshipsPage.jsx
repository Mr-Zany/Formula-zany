import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactModal from "../components/ContactModal";
import "./SponsorshipsPage.css";

// Section 3: left image (text overlaid) -> contact button -> right image.
// The decorative sweeping curve background is explicitly deferred to the
// brand book pass. Sponsorships are handled personally, not via fixed
// packages, so this reuses the same Contact form rather than a dedicated one.
export default function SponsorshipsPage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="app-shell">
      <Header />

      <main className="sponsorships-page">
        <div className="sponsorships-page__image sponsorships-page__image--left">
          <span className="sponsorships-page__overlay-text">
            Sponsor the build.
            <br />
            Be part of a genuine world first.
          </span>
        </div>

        <div className="sponsorships-page__center">
          <p>
            Sponsorships are handled directly and personally — placement and value are discussed
            one-on-one, not sold as fixed packages.
          </p>
          <button type="button" className="btn-primary" onClick={() => setContactOpen(true)}>
            Contact us
          </button>
        </div>

        <div className="sponsorships-page__image sponsorships-page__image--right" />
      </main>

      <Footer />

      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </div>
  );
}
