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
import TeamCreatePage from '@/pages/TeamCreatePage';
import LobbiesPage from '@/pages/LobbiesPage';
import MyInvitesPage from '@/pages/MyInvitesPage';
import MatchDetailsPage from '@/pages/MatchDetailsPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminMmrPage from '@/pages/admin/AdminMmrPage';
import AdminSeasonsPage from '@/pages/admin/AdminSeasonsPage';
import AdminTournamentsPage from '@/pages/admin/AdminTournamentsPage';
import AdminPlayersPage from '@/pages/admin/AdminPlayersPage';
import AdminAuditPage from '@/pages/admin/AdminAuditPage';

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
        <Route
          path="/teams/new"
          element={
            <ProtectedRoute>
              <TeamCreatePage />
            </ProtectedRoute>
          }
        />
        <Route path="/teams/:id" element={<TeamDetailsPage />} />

        <Route path="/lobbies" element={<LobbiesPage />} />
        <Route path="/matches/:id" element={<MatchDetailsPage />} />
        <Route
          path="/me/invites"
          element={
            <ProtectedRoute>
              <MyInvitesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="mmr" element={<AdminMmrPage />} />
          <Route path="seasons" element={<AdminSeasonsPage />} />
          <Route path="tournaments" element={<AdminTournamentsPage />} />
          <Route path="players" element={<AdminPlayersPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
