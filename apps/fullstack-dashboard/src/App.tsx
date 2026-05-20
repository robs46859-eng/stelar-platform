import { Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar.tsx';
import AgentsPage from './pages/AgentsPage.tsx';
import GatewayPage from './pages/GatewayPage.tsx';
import GovernancePage from './pages/GovernancePage.tsx';
import OverviewPage from './pages/OverviewPage.tsx';
import SecretsPage from './pages/SecretsPage.tsx';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/gateway" element={<GatewayPage />} />
          <Route path="/governance" element={<GovernancePage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/secrets" element={<SecretsPage />} />
        </Routes>
      </main>
    </div>
  );
}
