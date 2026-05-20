import { Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import PropertiesPage from './pages/PropertiesPage.tsx';
import ScreeningPage from './pages/ScreeningPage.tsx';
import TenantsPage from './pages/TenantsPage.tsx';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/screening" element={<ScreeningPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
        </Routes>
      </main>
    </div>
  );
}
