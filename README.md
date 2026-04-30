# Diaspo App

Initial monorepo scaffold for Diaspo App (mobile + web + shared packages).

## Structure

- `apps/mobile`: Expo Router mobile app
- `apps/web`: Next.js App Router web app
- `packages/ui`: design tokens and shared UI layer
- `packages/shared`: shared TypeScript types and utilities
- `packages/api`: API contracts and client layer (to be expanded)
- `packages/store`: global app state layer (to be expanded)

## Quick start

1. Install dependencies:

```bash
pnpm install
```

1. Run all apps in dev mode:

```bash
pnpm dev
```

## Stripe local setup

1. Install Stripe dependencies from the monorepo root:

```bash
pnpm --store-dir /home/benzi/.local/share/pnpm/store/v10 --filter @diaspo/backend add stripe
pnpm --store-dir /home/benzi/.local/share/pnpm/store/v10 --filter @diaspo/web add @stripe/stripe-js @stripe/react-stripe-js
pnpm --store-dir /home/benzi/.local/share/pnpm/store/v10 --filter @diaspo/mobile add @stripe/stripe-react-native
```

1. Configure env values:

- `apps/backend/.env`:
  - `STRIPE_SECRET_KEY=sk_test_...`
  - `STRIPE_WEBHOOK_SECRET=whsec_...`
  - `STRIPE_CURRENCY=eur`
  - `STRIPE_GNF_EUR_RATE=9300`
- `apps/web/.env.local`:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
- `apps/mobile/.env`:
  - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`

1. Validate typecheck:

```bash
pnpm --filter @diaspo/backend typecheck
pnpm --filter @diaspo/web typecheck
pnpm --filter @diaspo/mobile typecheck
```

1. Start webhook tunnel (optional but recommended):

```bash
stripe listen --forward-to localhost:4000/api/payments/webhook
```

## Staging / production sans donnees de demo

1. Use a clean database and run migrations only (do not run seed):

```bash
pnpm --filter @diaspo/backend db:migrate
```

1. Backend env (`apps/backend/.env`):

- `NODE_ENV=production`
- `DATABASE_URL=...` (base vide/propre)
- `JWT_SECRET=...` (long random secret)
- `CORS_ORIGIN=https://<your-web-domain>`
- `STRIPE_SECRET_KEY=sk_live_...` (or `sk_test_...` in staging)
- `STRIPE_WEBHOOK_SECRET=whsec_...`

1. Web env:

- `NEXT_PUBLIC_USE_REAL_API=true`
- `NEXT_PUBLIC_API_MOCKING=disabled`
- `NEXT_PUBLIC_ALLOW_API_MOCK_FALLBACK=false`
- `NEXT_PUBLIC_API_BASE_URL=https://<your-backend-domain>`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` (or test key in staging)

1. Mobile env:

- `EXPO_PUBLIC_USE_REAL_API=true`
- `EXPO_PUBLIC_ALLOW_API_MOCK_FALLBACK=false`
- `EXPO_PUBLIC_API_BASE_URL=https://<your-backend-domain>`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` (or test key in staging)

1. Initial accounts:

- Create real accounts through the app flows, or create only an admin bootstrap account.
- Avoid loading `apps/backend/src/db/seed.ts` outside local development.

## Current implementation status

- Monorepo scaffolding complete
- Security middleware for `/admin` added on web
- Initial auth type contracts added
- Design color tokens + base UI components added
- Full route skeleton created for web/mobile diaspora, agence, admin
- Shared FR translation file initialized
- Auth store (Zustand) initialized
- Mock API foundation (MSW handlers + mock datasets) initialized
- Web login/dashboard now wired to shared UI and API hook
- React Query providers wired on web and mobile roots
- Optional web MSW runtime bootstrap added (`NEXT_PUBLIC_API_MOCKING=enabled`)
- Diaspora web pages `paiements` and `messages` now connected to API hooks
- Shared business UI components added: `StatCard`, `ChatBubble`, `TrackingCard`
- Global theme base added for web (`globals.css`) and mobile (`theme/tokens.ts`)
- Phase 2 started: diaspora dashboard expanded (stats, timeline, gallery, notifications)
- Payment confirmation modal + success overlay added (web and mobile diaspora)
- Diaspora chat upgraded with input, send action, and auto-scroll behavior
- Diaspora documents implemented (list + metadata + download actions) on web/mobile
- Diaspora colis implemented (tracking, shipping form, history) on web/mobile
- API mocks expanded with documents and richer colis data + new React Query hooks
- Dashboard diaspora refined with interactive Photos/Details tabs and richer timeline visuals
- Tracking active step pulse animation added in shared `TrackingCard`
- Web typography now aligned with planning (`Plus Jakarta Sans` + `Cormorant Garamond` via Next fonts)
- Diaspora web layout and page spacing refined for closer prototype parity
- Dashboard diaspora now uses a two-column desktop composition closer to the validated prototype
- Diaspora documents/colis pages visually harmonized (headers, rows, service cards, spacing)
- Core Phase 2 interactions now connected: payment confirmation, message send, and new shipping request
- Added React Query mutation hooks with cache invalidation for payments/messages/colis flows
- Mobile diaspora now aligned with API logic for payments, messages, and colis requests
- Phase 3 started: agence API domain added (projects, chantier progress, payment requests, conversations/messages)
- Agence web screens now connected to real query/mutation flows (projets, chantier, paiements, messages)
- Agence mobile projets screen now reads live agence projects from shared API hooks
- Agence mobile screens now connected to API logic for chantier updates, payment requests, and messaging flows
- Agence colis module now connected end-to-end on web/mobile (stats, list, and status progression actions)
- Phase 4 started: admin API domain added (dashboard, projects, finances, users, notifications, exports)
- Admin web pages now connected to mock data via React Query hooks and secured route structure
- Admin interactions added: project status filters, mark notifications read (single/all), and export run actions
- Admin users now support activate/deactivate actions with API mutation + cache refresh
- Admin project and user pages now include multi-criteria filters (search, owner/role/status)
- Admin projects now support status progression actions via mutation (retard → en_cours → livraison_proche → termine)
- Admin login now includes a functional simulated flow (credentials + mock 2FA + redirect to `/admin/dashboard`)
- Admin auth flow now includes session guard in middleware (token value + simulated expiry) and logout action in admin sidebar
- Public login buttons now trigger simulated auth sessions (diaspora/agence cookies) with role-based redirection
- Public web routes now enforce simulated session validity via middleware (auth token + expiry + role-based redirects)
- Phase 5 started: backend scaffold added in `apps/backend` (Fastify structure + health/auth routes)
- API layer now supports progressive switch mock -> real backend via env flags (`NEXT_PUBLIC_USE_REAL_API`, `NEXT_PUBLIC_API_BASE_URL`)
- Diaspora real backend endpoints now available (`/api/projects/:id`, `/payments`, `/documents`, `/messages`, `/colis` + POST mutations)
- Agence real backend endpoints now available (`/api/agence/projects`, progress update, payments requests, conversations/messages, colis status updates)
- Admin real backend endpoints now available (`/api/admin/dashboard`, projects/users/finances/notifications/exports + mutations)
- In real API mode (`NEXT_PUBLIC_USE_REAL_API=true`), frontend API client keeps real API behavior; auth-related `401/403` fallback to mock is controlled by `NEXT_PUBLIC_ALLOW_API_MOCK_FALLBACK` / `EXPO_PUBLIC_ALLOW_API_MOCK_FALLBACK` (set `false` in staging/production)
- Sprint 2 started: shared `zod` schemas added for auth, payments, colis, and chantier update flows
- Web and mobile core forms now migrated to `react-hook-form` + `zodResolver` (login, chantier update, payment request, colis request, payment confirm modal)
- Shared web form components added in `packages/ui` (`InputField`, `SelectField`, `TextareaField`) and reused in agence/login flows
- Frontend-first pass in progress: Diaspora/Agence/Admin web screens harmonized (Tailwind/utilities, empty/loading/error states, disabled actions)
- Mobile UX pass progressed: API-driven states standardized on key Diaspora/Agence screens (messages, paiements, colis, projets, dashboard, documents)
- Stripe payment flow added for Diaspora transactions (create intent + webhook on backend, Stripe Elements on web, PaymentSheet on mobile)

