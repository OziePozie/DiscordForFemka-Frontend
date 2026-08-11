import { Route, Routes } from 'react-router-dom';
import TelegramAuthGate from './TelegramAuthGate';
import { useBackButton } from './lib/useBackButton';
import HomePage from './pages/HomePage';
import MyProfilePage from './pages/MyProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import PrivacyPage from './pages/PrivacyPage';
import PlayersPage from './pages/PlayersPage';
import PlayerViewPage from './pages/PlayerViewPage';

export default function TgApp() {
  useBackButton();

  return (
    <TelegramAuthGate>
      <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<MyProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
          <Route path="/profile/privacy" element={<PrivacyPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerViewPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </TelegramAuthGate>
  );
}
