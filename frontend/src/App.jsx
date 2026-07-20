import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { captureReferralFromUrl } from "./referral";
import "./App.css";

export default function App() {
  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
