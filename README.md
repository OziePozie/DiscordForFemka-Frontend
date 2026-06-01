# Femka Platform — frontend

Vite + React 18 + TypeScript + Tailwind + shadcn/ui + TanStack Query + React Router v6.

## Команды

```bash
npm install              # установить зависимости
npm run dev              # dev-сервер на http://localhost:5173 (проксирует /api и /oauth на локальный :8085)
npm run dev:staging      # то же, но проксирует на STAGING-бэкенд (см. ниже) — локальный бэк не нужен
npm run build            # сборка в dist/
npm run preview          # локальный просмотр прод-сборки
npm run gen:types        # регенерация TS-типов из docs/contracts/openapi.yaml
```

## Бэкенд для разработки

Фронт ходит в бэкенд через dev-прокси Vite (`/api`, `/oauth`). Куда проксировать —
задаёт переменная `VITE_API_TARGET` (по умолчанию `http://localhost:8085`).

**Вариант 1 — общий staging-бэкенд (проще всего, локальный бэкенд не нужен):**

```bash
npm run dev:staging
```

Использует `.env.staging` → `VITE_API_TARGET=http://31.42.189.112:8090`. Это
веб/API-инстанс бэкенда с **отключённым** Discord-ботом, данные тестовые. Логин
через Discord там не работает (бот выключен) — это ожидаемо.

**Вариант 2 — свой локальный бэкенд на :8085:**

```bash
npm run dev
```

Либо переопредели цель в `.env.local` (см. `.env.example`):

```
VITE_API_TARGET=http://localhost:8085
```

Прод-сборкой (`npm run build`) это не управляется — на проде проксирование делает
nginx (см. `nginx.conf`).

## Стек

- React 18 + TypeScript (strict)
- Vite 5 с React SWC plugin
- TailwindCSS 3 + tailwindcss-animate
- shadcn/ui (минимальный набор: button, input, card, avatar, badge, dropdown-menu, select, skeleton, label, dialog, toast)
- TanStack Query v5 для server state
- React Router v6 для роутинга
- openapi-typescript для генерации DTO-типов из контракта

## Структура

```
src/
├── main.tsx, App.tsx, index.css
├── lib/
│   ├── api/        client.ts, types.gen.ts (генерится), types.ts, endpoints.ts
│   ├── queries.ts  TanStack Query хуки
│   ├── auth.ts     useAuth helper
│   └── utils.ts    cn()
├── components/
│   ├── ui/         shadcn компоненты
│   ├── Layout.tsx, Header.tsx, ProtectedRoute.tsx
└── pages/          HomePage, ProfilePage, PlayerPublicPage, NotFoundPage
```
