import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TermsPage from "./pages/TermsPage";
import AboutUsPage from "./pages/AboutUsPage";
import SponsorshipsPage from "./pages/SponsorshipsPage";
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
      <Route path="/about-us" element={<AboutUsPage />} />
      <Route path="/sponsorships" element={<SponsorshipsPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
