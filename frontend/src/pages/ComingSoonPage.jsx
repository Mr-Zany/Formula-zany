import Header from "../components/Header";
import Footer from "../components/Footer";

// Minimal placeholder so nav/footer links to pages that aren't built yet
// (About Us, Sponsorships) go somewhere real instead of silently falling
// through to Home via the wildcard route.
export default function ComingSoonPage({ title }) {
  return (
    <div className="app-shell">
      <Header />
      <main className="placeholder-main">
        <h1>{title}</h1>
        <p>This page is coming soon.</p>
      </main>
      <Footer />
    </div>
  );
}
