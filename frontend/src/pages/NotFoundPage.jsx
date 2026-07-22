import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./NotFoundPage.css";

// Section 23. Unmatched URLs land here instead of silently falling through
// to HomePage (App.jsx's old `path="*"` behavior).
export default function NotFoundPage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="not-found-page">
        <div className="not-found-page__card">
          <div className="not-found-page__code">404</div>
          <h1>Wrong turn</h1>
          <p>This page isn't part of the build. Let's get you back on track.</p>
          <Link to="/" className="btn-secondary not-found-page__cta">
            Back to the build
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
