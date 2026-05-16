# Femka Platform — frontend

Vite + React 18 + TypeScript + Tailwind + shadcn/ui + TanStack Query + React Router v6.

## Команды

```bash
cd frontend
npm install              # установить зависимости
npm run dev              # dev-сервер на http://localhost:5173 (проксирует /api и /oauth на :8085)
npm run build            # сборка в dist/
npm run preview          # локальный просмотр прод-сборки
npm run gen:types        # регенерация TS-типов из docs/contracts/openapi.yaml
```

Чтобы войти, бекенд должен крутиться на :8085 с Postgres+Redis из docker-compose.dev.yml.

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
