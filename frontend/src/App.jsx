import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TermsPage from "./pages/TermsPage";
import AboutUsPage from "./pages/AboutUsPage";
import SponsorshipsPage from "./pages/SponsorshipsPage";
import NotFoundPage from "./pages/NotFoundPage";
import DonateSuccessPage from "./pages/DonateSuccessPage";
import { captureReferralFromUrl } from "./referral";
import { useAuth } from "./auth/AuthContext";
import { NotificationProvider } from "./notifications/NotificationContext";
import ToastStack from "./notifications/ToastStack";
import LiveNotificationWatcher from "./notifications/LiveNotificationWatcher";
import TosReconsentModal from "./components/TosReconsentModal";
import CookieNotice from "./components/CookieNotice";
import "./App.css";

export default function App() {
  const { user } = useAuth();

  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  return (
    <NotificationProvider>
      <LiveNotificationWatcher />
      <ToastStack />
      {user?.needs_tos_reconsent && <TosReconsentModal />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/sponsorships" element={<SponsorshipsPage />} />
        <Route path="/donate/success" element={<DonateSuccessPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <CookieNotice />
    </NotificationProvider>
  );
}
