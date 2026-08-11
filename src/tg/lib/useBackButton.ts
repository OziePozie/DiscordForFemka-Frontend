import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { webApp } from './telegram';

/**
 * Нативная кнопка «назад» Telegram: показывается везде, кроме корневого
 * экрана, и уводит на один шаг назад по истории роутера.
 */
export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const tg = webApp();
    if (!tg) return;

    const isRoot = location.pathname === '/';
    const handler = () => navigate(-1);

    if (isRoot) {
      tg.BackButton.hide();
      return;
    }

    tg.BackButton.onClick(handler);
    tg.BackButton.show();
    return () => {
      tg.BackButton.offClick(handler);
      tg.BackButton.hide();
    };
  }, [location.pathname, navigate]);
}
