import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import LegalDisclaimerPage from "./pages/LegalDisclaimerPage.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";
import VacayTourPage from "./pages/VacayTourPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/tour" element={<VacayTourPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/legal/disclaimer" element={<LegalDisclaimerPage />} />
    </Routes>
  );
}
