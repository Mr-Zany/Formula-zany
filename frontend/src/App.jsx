import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TermsPage from "./pages/TermsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import { captureReferralFromUrl } from "./referral";
import "./App.css";

export default function App() {
  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/about-us" element={<ComingSoonPage title="About Us" />} />
      <Route path="/sponsorships" element={<ComingSoonPage title="Sponsorships" />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
