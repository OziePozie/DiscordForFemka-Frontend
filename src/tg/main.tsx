import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TgApp from './TgApp';
import { webApp } from './lib/telegram';
import '../index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/** Разворачивает вебвью и держит класс .dark в синхроне с темой Telegram. */
function TelegramShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const tg = webApp();
    if (!tg) return;
    tg.ready();
    tg.expand();

    const applyScheme = () =>
      document.documentElement.classList.toggle('dark', tg.colorScheme === 'dark');
    applyScheme();
    tg.onEvent('themeChanged', applyScheme);
    return () => tg.offEvent('themeChanged', applyScheme);
  }, []);

  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/tg">
        <TelegramShell>
          <TgApp />
        </TelegramShell>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
