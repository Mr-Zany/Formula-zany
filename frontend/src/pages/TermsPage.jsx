import Header from "../components/Header";
import Footer from "../components/Footer";
import TermsContent from "../components/TermsContent";
import "./TermsPage.css";

// Renders the actual Terms of Service draft (Section 5c) -- see
// TermsContent for the body, shared with the re-consent pop-up.
export default function TermsPage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="terms-page">
        <TermsContent />
      </main>
      <Footer />
    </div>
  );
}
