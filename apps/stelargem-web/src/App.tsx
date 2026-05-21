import { Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar.tsx';
import CorridorsPage from './pages/CorridorsPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import NeighborhoodDetailPage from './pages/NeighborhoodDetailPage.tsx';
import NeighborhoodsPage from './pages/NeighborhoodsPage.tsx';
import TourPage from './pages/TourPage.tsx';

export default function App() {
  return (
    <div className="min-h-screen bg-emerald-50">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/neighborhoods" element={<NeighborhoodsPage />} />
          <Route path="/neighborhoods/:id" element={<NeighborhoodDetailPage />} />
          <Route path="/neighborhoods/:id/tour" element={<TourPage />} />
          <Route path="/corridors" element={<CorridorsPage />} />
        </Routes>
      </main>
    </div>
  );
}
