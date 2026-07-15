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
import AdminTeamsPage from '@/pages/admin/AdminTeamsPage';
import AdminMatchesPage from '@/pages/admin/AdminMatchesPage';
import AdminAuditPage from '@/pages/admin/AdminAuditPage';
import AdminBotsPage from '@/pages/admin/AdminBotsPage';
import ArchivePage from '@/pages/ArchivePage';
import LeaderboardPage from '@/pages/LeaderboardPage';

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

        <Route path="/scenes" element={<SeasonsListPage />} />
        <Route path="/scenes/:slug" element={<SeasonDetailsPage />} />
        <Route path="/tournaments/:slug" element={<TournamentDetailsPage />} />
        <Route
          path="/teams/new"
          element={
            <ProtectedRoute>
              <TeamCreatePage />
            </ProtectedRoute>
          }
        />
        <Route path="/teams/:id" element={<TeamDetailsPage />} />

        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/lobbies" element={<LobbiesPage />} />
        <Route path="/matches/:id" element={<MatchDetailsPage />} />
        <Route path="/archive" element={<ArchivePage />} />
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
          <Route path="matches" element={<AdminMatchesPage />} />
          <Route path="players" element={<AdminPlayersPage />} />
          <Route path="teams" element={<AdminTeamsPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="bots" element={<AdminBotsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
