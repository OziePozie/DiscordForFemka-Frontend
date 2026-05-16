import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import ProfilePage from '@/pages/ProfilePage';
import PlayerPublicPage from '@/pages/PlayerPublicPage';
import NotFoundPage from '@/pages/NotFoundPage';
import SeasonsListPage from '@/pages/SeasonsListPage';
import SeasonDetailsPage from '@/pages/SeasonDetailsPage';
import TournamentDetailsPage from '@/pages/TournamentDetailsPage';
import TeamsListPage from '@/pages/TeamsListPage';
import TeamDetailsPage from '@/pages/TeamDetailsPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminMmrPage from '@/pages/admin/AdminMmrPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/players/:id" element={<PlayerPublicPage />} />

        <Route path="/seasons" element={<SeasonsListPage />} />
        <Route path="/seasons/:slug" element={<SeasonDetailsPage />} />
        <Route path="/tournaments/:slug" element={<TournamentDetailsPage />} />
        <Route path="/teams" element={<TeamsListPage />} />
        <Route path="/teams/:id" element={<TeamDetailsPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="mmr" element={<AdminMmrPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
