import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import TermsPage from "./pages/TermsPage.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import LegalDisclaimerPage from "./pages/LegalDisclaimerPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/legal/disclaimer" element={<LegalDisclaimerPage />} />
    </Routes>
  );
}
