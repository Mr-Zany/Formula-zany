import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import "./App.css";

function HomePlaceholder() {
  return (
    <div className="app-shell">
      <Header />
      <main className="placeholder-main">
        <h1>Formula Zany</h1>
        <p>Home page content comes in a later milestone.</p>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={<HomePlaceholder />} />
    </Routes>
  );
}
