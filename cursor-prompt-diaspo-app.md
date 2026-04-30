# Cursor Prompt — Diaspo App
## Développement complet React Native Expo + Next.js

---

## 🎯 CONTEXTE DU PROJET

Tu vas développer **Diaspo App**, une plateforme digitale destinée aux membres de la diaspora africaine qui souhaitent construire en Guinée (Conakry). L'app permet de :
- Suivre l'avancement des chantiers en temps réel
- Gérer les paiements par étapes en GNF / EUR
- Communiquer avec l'agence locale (Conakry)
- Envoyer et suivre des colis depuis l'Europe vers le chantier
- Gérer des documents contractuels (PDF)

Un **prototype HTML interactif complet** a déjà été validé par les parties prenantes. Il sert de référence exacte pour le design, les parcours utilisateurs et les fonctionnalités.

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Monorepo avec partage de code maximum

```
diaspo-app/
├── apps/
│   ├── mobile/          # React Native Expo (iOS + Android)
│   └── web/             # Next.js 14+ (App Router) — desktop & web
├── packages/
│   ├── ui/              # Composants partagés (design system)
│   ├── shared/          # Hooks, utils, types TypeScript, constantes
│   ├── api/             # Client API + React Query hooks
│   └── store/           # Zustand — state management global
├── package.json         # Workspace root (pnpm workspaces)
└── turbo.json           # Turborepo
```

### Stack technique

| Couche | Technologie |
|--------|-------------|
| Mobile | React Native + Expo SDK 51+ |
| Web/Desktop | Next.js 14 (App Router) |
| Partage de code | pnpm workspaces + Turborepo |
| Language | TypeScript strict |
| State management | Zustand |
| Data fetching | TanStack Query (React Query v5) |
| Navigation mobile | Expo Router v3 (file-based) |
| Navigation web | Next.js App Router |
| Styles mobile | NativeWind v4 (Tailwind pour RN) |
| Styles web | Tailwind CSS v3 |
| Formulaires | React Hook Form + Zod |
| Tests | Jest + React Native Testing Library |

---

## 🎨 DESIGN SYSTEM — Respecter exactement ces tokens

### Palette de couleurs (extraite du prototype validé)

```typescript
// packages/ui/src/tokens/colors.ts
export const colors = {
  blue: '#1A6FC4',
  blueMid: '#2582DB',
  blueLight: '#4FA3F0',
  bluePale: '#EAF4FF',
  gold: '#C8922A',
  goldLight: '#E8B84B',
  goldPale: '#FEF8EC',
  green: '#1B7A45',
  greenLight: '#22A05A',
  red: '#CE1126',
  bg: '#F4F7FB',
  bg2: '#EBF1F9',
  white: '#FFFFFF',
  dark: '#0E1B2E',
  dark2: '#1C2E46',
  border: '#D6E4F2',
  text: '#1A2B40',
  textMid: '#4A6080',
  textMuted: '#8AA0B8',
} as const;
```

### Typographie
- Titres : **Cormorant Garamond** (serif)
- Corps : **Plus Jakarta Sans** (sans-serif)
- Utiliser `expo-google-fonts` sur mobile, Google Fonts sur web

### Règle de design
Reproduire **fidèlement** l'UI du prototype pour chaque écran. Les cards ont `borderRadius: 20`, les boutons principaux ont un gradient bleu `#1A6FC4 → #2582DB`, les ombres sont légères (`rgba(26,111,196,0.09)`).

---

## 👥 SYSTÈME D'AUTHENTIFICATION ET DE RÔLES

### ⚠️ RÈGLE DE SÉCURITÉ CRITIQUE

**NE PAS exposer l'interface de connexion Admin sur le frontend public.**

- L'app mobile et le site web public n'affichent que **2 rôles** : `Diaspora` et `Agence`
- L'interface Admin est accessible **uniquement** via une route séparée et protégée : `/admin` (web seulement)
- Cette route `/admin` doit être :
  - Non indexée par les moteurs de recherche (`noindex`)
  - Protégée par un middleware d'authentification côté serveur (Next.js middleware)
  - Idéalement restreinte par IP blanche en production
- Sur mobile, le rôle Admin **n'existe pas**. Si un token admin est détecté sur mobile, rediriger vers une page d'erreur.

### Structure des rôles

```typescript
// packages/shared/src/types/auth.ts
export type UserRole = 'diaspora' | 'agence';
export type AdminRole = 'admin'; // Web seulement, route séparée

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  location?: string; // ex: "Paris, France"
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### Flux d'authentification

```
Login public (mobile + web)
  ├── Email + mot de passe
  ├── Sélecteur de rôle : [🌍 Diaspora] [🏢 Agence]
  ├── JWT stocké dans SecureStore (mobile) / httpOnly cookie (web)
  └── Redirection selon le rôle → /diaspora/dashboard ou /agence/projets

Login Admin (web uniquement, route /admin/login)
  ├── Email + mot de passe (credentials distincts)
  ├── 2FA obligatoire (TOTP)
  └── Redirection → /admin/dashboard
```

---

## 📱 ESPACE DIASPORA — Écrans à implémenter

### Navigation mobile (Expo Router)
Bottom tab navigator avec 5 onglets :

```
(tabs)/
├── index.tsx          → Tableau de bord
├── paiements.tsx      → Paiements
├── messages.tsx       → Messagerie
├── documents.tsx      → Documents
└── colis.tsx          → Colis
```

### 1. Tableau de bord (`/diaspora/dashboard`)

**Composants à créer :**

- `AlertBanner` — Bannière pulsante (or) pour paiement en attente avec CTA "Payer maintenant"
- `StatsGrid` — Grille 2×2 de cartes statistiques :
  - Avancement global : **47%** (tendance ↑ +8%)
  - Étapes validées : **3/8**
  - GNF versés : **12.6M** (3 paiements)
  - Délai estimé : **4 mois** (Juillet 2025)
- `ConstructionTimeline` — Timeline verticale avec 5 étapes :
  - ✅ Préparation du terrain (Terminé – 10 Jan 2025)
  - ✅ Fondations (Terminé – 5 Fév 2025)
  - 🔵 Élévation des murs (En cours – 60%, progress bar animée)
  - ⏳ Toiture (En attente)
  - ⏳ Finitions intérieures & extérieures (En attente)
- `PhotoGallery` — Grille 3×2 de photos de chantier avec onglets Photos/Détails
- `ChatPreview` — Aperçu de la messagerie chantier avec les 3 derniers messages
- `NotificationsList` — 3 dernières notifications (paiement, photos, étape validée)

### 2. Paiements (`/diaspora/paiements`)

- Cartes de stats : Total versé, En attente, Budget consommé (%), Équivalent EUR
- Card "Demande en cours" avec AlertBanner
- Liste historique des paiements avec statuts (✅ payé / ⏳ en attente)
- `PaymentModal` — Modal de confirmation de paiement :
  - Montant : **4 200 000 GNF** / ≈ 450€
  - Méthodes : Carte bancaire / Western Union
  - Bouton "Confirmer le paiement"
  - `SuccessOverlay` après confirmation

### 3. Messagerie (`/diaspora/messages`)

- Interface de chat avec l'agence (type WhatsApp)
- Historique des messages (bulles bleues = moi, blanches = agence)
- Input avec envoi par touche Entrée
- Avatars initiales colorées (MK = bleu, AG = vert)
- Timestamp sur chaque message

### 4. Documents (`/diaspora/documents`)

- Liste de fichiers avec icône, nom, date, taille
- Bouton de téléchargement par fichier
- Documents : Permis de construire, Contrat agence, Devis initial, Reçus, Rapports

### 5. Colis (`/diaspora/colis`)

- `TrackingCard` — Carte sombre (gradient #0E1B2E → #1C3A6E) avec :
  - Numéro de suivi (BL-2025-0047)
  - Stepper 5 étapes : Paris → CDG → ✈ Vol (actif pulsant) → Conakry → Chantier
- Grille 3 services : Électroménager / Matériaux / Effets personnels
- Formulaire d'envoi : type, poids, valeur déclarée, description, adresse livraison
- Historique des envois avec statuts (En vol, Livré)

---

## 🏢 ESPACE AGENCE — Écrans à implémenter

### Navigation mobile
Bottom tab navigator avec 5 onglets : Projets / Chantier / Paiements / Colis / Messages

### 1. Gestion des projets (`/agence/projets`)

- Cartes stats : 4 projets actifs, 2 paiements en attente, 1 livraison ce mois, 1 retard
- Tableau des projets (liste sur mobile) :

| Client | Projet | Étape | Avancement | Statut |
|--------|--------|-------|-----------|--------|
| Mariam Kouyaté (Paris) | Villa Ratoma | Murs (Étape 3) | 47% | En cours |
| Ibrahima Diallo (Lyon) | Maison Dixinn | Finitions | 90% | Livraison proche |
| Aissatou Barry (Montréal) | Duplex Kaloum | Fondations | 15% – Retard | Retard 12j |
| Mamadou Bah (Bruxelles) | Villa Kipé | Toiture | 65% | Paiement attendu |

### 2. Mise à jour chantier (`/agence/chantier`)

- Upload de photos (multi-sélection, aperçu, suppression)
- Sélecteur d'étape (dropdown)
- Slider d'avancement 0–100%
- Zone de commentaire (textarea)
- Formulaire de demande de paiement (étape, montant GNF, joindre PDF)
- Bouton "Envoyer mise à jour"

### 3. Paiements agence (`/agence/paiements`)

- Formulaire de création de demande (client, étape, montant)
- Liste des demandes récentes avec statuts

### 4. Colis agence (`/agence/colis`)

- Stats : En transit, À récupérer, En livraison, Problème douane
- Liste des colis en cours avec statuts et actions

### 5. Messagerie agence (`/agence/messages`)

- Liste des conversations clients (avec badge "non lus")
- Interface de chat pour chaque client
- Conversation active : Mariam Kouyaté (2 non lus)

---

## ⚙️ BACK-OFFICE ADMIN — Web uniquement (`/admin`)

> Accessible uniquement sur Next.js web, route protégée, jamais sur mobile.

### Layout
Sidebar fixe (220px) + zone de contenu principale

### Sections de la sidebar
```
Principal
  📊 Tableau de bord
  🏗️ Tous les projets
  💰 Finances
  📦 Colis & Transferts

Gestion
  👥 Utilisateurs (badge: 24)
  🔔 Notifications (badge: 7)

Système
  📤 Exports CSV/PDF
  🔒 Sécurité & 2FA
```

### 1. Tableau de bord admin

- KPIs : 7 projets actifs, 24 clients, 89% satisfaction, 2 alertes retard
- Graphique barres : paiements mensuels (Oct → Mars)
- Widget alertes actives : retard Aissatou Barry, paiement suspendu Mamadou Bah
- Liste utilisateurs récents

### 2. Tous les projets

- Filtres : Tous (7) / En cours (4) / Paiement attendu (2) / Retard (1)
- Tableau complet avec colonnes : Client, Projet, Localisation, Avancement, Statut, Responsable, Actions

### 3. Finances

- KPIs : 48.4M GNF reçus, 9.0M en attente, ≈5 180€ EUR, 7.2% commission
- Graphique évolution mensuelle
- Répartition par projet (barres de progression)

### 4. Colis & Transferts admin

- KPIs : 8 en transit, 34 livrés ce mois, 1 240 kg, 2 problèmes douane
- Liste de tous les colis avec statuts

### 5. Utilisateurs

- Recherche + filtre par rôle
- Tableau : Nom, Rôle, Localisation, Statut, Dernière connexion, Actions

### 6. Centre de notifications

- Liste des alertes : retards, paiements, colis bloqués, livraisons terminées
- Bouton "Tout marquer lu"

### 7. Exports

- Grille 3×2 : Rapport mensuel (PDF), Comptabilité (CSV), Liste clients (CSV), Suivi projets (PDF), Colis (CSV), Rapport investisseurs (PDF)

---

## 🔌 ARCHITECTURE API (Backend — à préparer)

### Structure des endpoints REST

```typescript
// packages/api/src/endpoints.ts

// AUTH
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/admin/login    // Route séparée admin

// DIASPORA
GET    /api/projects/:id                  // Données du projet
GET    /api/projects/:id/timeline         // Étapes du chantier
GET    /api/projects/:id/photos           // Photos
GET    /api/projects/:id/documents        // Documents
GET    /api/projects/:id/payments         // Paiements
POST   /api/projects/:id/payments         // Initier un paiement
GET    /api/messages/:projectId           // Messages
POST   /api/messages/:projectId           // Envoyer message
GET    /api/colis                         // Mes colis
POST   /api/colis                         // Nouvelle demande

// AGENCE
GET    /api/agence/projects               // Tous les projets agence
PATCH  /api/agence/projects/:id/progress  // Mise à jour avancement
POST   /api/agence/projects/:id/photos    // Upload photos
POST   /api/agence/payments/request       // Demande de paiement
GET    /api/agence/colis                  // Colis à gérer

// ADMIN (protégé côté serveur)
GET    /api/admin/dashboard
GET    /api/admin/projects
GET    /api/admin/users
GET    /api/admin/finances
GET    /api/admin/notifications
POST   /api/admin/exports/:type
```

### Mock API pour démarrer

Utiliser **MSW (Mock Service Worker)** pour simuler le backend pendant le développement :
```
packages/api/src/mocks/
├── handlers.ts     // Tous les handlers MSW
├── data/
│   ├── projects.ts
│   ├── users.ts
│   ├── payments.ts
│   └── colis.ts
```

---

## 📁 STRUCTURE DÉTAILLÉE DES FICHIERS

### Package `packages/ui` — Design system partagé

```
packages/ui/src/
├── tokens/
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
├── components/
│   ├── Button/
│   │   ├── Button.tsx          # Bouton primary/outline/ghost
│   │   └── Button.stories.tsx
│   ├── Card/                   # Card avec shadow et borderRadius 20
│   ├── Avatar/                 # Initiales colorées (MK, AG, etc.)
│   ├── Badge/                  # Pills : p-green, p-gold, p-red, p-blue
│   ├── StatCard/               # Carte statistique avec tendance
│   ├── AlertBanner/            # Bannière pulsante or/rouge
│   ├── ProgressBar/            # Barre de progression animée
│   ├── Timeline/               # Timeline verticale avec dots
│   ├── ChatBubble/             # Bulle de message (moi / autre)
│   ├── PaymentRow/             # Ligne de paiement avec icône/montant
│   ├── TrackingCard/           # Carte de suivi colis
│   └── Modal/                  # Modal avec backdrop blur
└── index.ts
```

### App mobile `apps/mobile`

```
apps/mobile/
├── app/
│   ├── (auth)/
│   │   └── login.tsx
│   ├── (diaspora)/
│   │   ├── _layout.tsx         # Bottom tabs
│   │   ├── index.tsx           # Dashboard
│   │   ├── paiements.tsx
│   │   ├── messages.tsx
│   │   ├── documents.tsx
│   │   └── colis.tsx
│   ├── (agence)/
│   │   ├── _layout.tsx
│   │   ├── projets.tsx
│   │   ├── chantier.tsx
│   │   ├── paiements.tsx
│   │   ├── colis.tsx
│   │   └── messages.tsx
│   └── _layout.tsx             # Root layout + auth guard
├── assets/
└── app.json
```

### App web `apps/web`

```
apps/web/
├── app/
│   ├── (public)/
│   │   └── login/
│   │       └── page.tsx        # Login Diaspora + Agence SEULEMENT
│   ├── (diaspora)/
│   │   ├── layout.tsx          # TopNav + sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── paiements/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── documents/page.tsx
│   │   └── colis/page.tsx
│   ├── (agence)/
│   │   ├── layout.tsx
│   │   ├── projets/page.tsx
│   │   ├── chantier/page.tsx
│   │   ├── paiements/page.tsx
│   │   ├── colis/page.tsx
│   │   └── messages/page.tsx
│   ├── admin/                  # ⚠️ Route protégée — SÉPARÉE
│   │   ├── login/page.tsx      # Login admin uniquement ici
│   │   ├── layout.tsx          # Sidebar admin
│   │   ├── dashboard/page.tsx
│   │   ├── projets/page.tsx
│   │   ├── finances/page.tsx
│   │   ├── colis/page.tsx
│   │   ├── utilisateurs/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── exports/page.tsx
│   └── middleware.ts           # Protège /admin/* côté serveur
├── tailwind.config.ts
└── next.config.ts
```

---

## 🔒 MIDDLEWARE DE SÉCURITÉ (Next.js)

```typescript
// apps/web/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protection de toutes les routes /admin
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('admin_token');

    // Pas de token → redirection vers login admin (PAS le login public)
    if (!adminToken && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Headers de sécurité supplémentaires sur les routes admin
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  // Protection des routes privées diaspora/agence
  if (pathname.startsWith('/diaspora') || pathname.startsWith('/agence')) {
    const token = request.cookies.get('auth_token');
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/diaspora/:path*', '/agence/:path*'],
};
```

---

## 🚀 INSTRUCTIONS DE DÉMARRAGE

### 1. Initialiser le projet

```bash
# Créer le monorepo
mkdir diaspo-app && cd diaspo-app
pnpm init

# Configurer Turborepo
pnpm add -D turbo
npx turbo init

# Créer les apps
cd apps
npx create-next-app@latest web --typescript --tailwind --app
npx create-expo-app mobile --template blank-typescript

# Créer les packages
mkdir -p ../packages/ui ../packages/shared ../packages/api ../packages/store
```

### 2. Ordre de développement recommandé

```
Phase 1 — Fondations (Sprint 1-2)
  ✅ Setup monorepo Turborepo + pnpm workspaces
  ✅ Design system : tokens couleurs, typographie, composants de base
  ✅ Authentification : login page mobile + web (sans admin)
  ✅ Navigation : Expo Router (mobile) + App Router (web)
  ✅ Mock API avec MSW

Phase 2 — Espace Diaspora (Sprint 3-4)
  ✅ Dashboard avec tous les composants
  ✅ Paiements + modal de confirmation
  ✅ Messagerie chat
  ✅ Documents
  ✅ Colis + tracking

Phase 3 — Espace Agence (Sprint 5)
  ✅ Gestion des projets
  ✅ Mise à jour chantier + upload photos
  ✅ Paiements et messagerie agence

Phase 4 — Back-office Admin (Sprint 6)
  ✅ Setup route /admin sécurisée
  ✅ Dashboard + projets + finances
  ✅ Utilisateurs + notifications + exports

Phase 5 — Backend réel (Sprint 7-8)
  ✅ API Node.js/Fastify ou Django
  ✅ Base de données PostgreSQL
  ✅ Remplacement des mocks MSW par les vrais endpoints
  ✅ Upload photos (S3/Cloudinary)
  ✅ Notifications push (Expo Push + FCM)
```

---

## 📋 RÈGLES GÉNÉRALES POUR CURSOR

1. **TypeScript strict** — Pas de `any`, toujours typer les props et les retours de fonction
2. **Composants dans `packages/ui`** — Tout composant réutilisé sur mobile ET web va dans le package partagé
3. **Pas de logique métier dans les composants UI** — Les composants reçoivent des données en props, la logique est dans les hooks
4. **Nommage** — PascalCase pour composants, camelCase pour hooks (`usePayments`), SCREAMING_SNAKE pour constantes
5. **i18n ready** — Toutes les chaînes de caractères dans des fichiers de traduction (`fr.json`) depuis le début
6. **Accessibilité** — Ajouter `accessibilityLabel` sur tous les éléments interactifs React Native
7. **Aucun secret dans le code** — Variables d'environnement dans `.env.local` (web) et `app.config.js` extra (mobile)
8. **Responsive web** — Le layout desktop utilise la sidebar, le layout mobile (< 768px) utilise un bottom nav identique à l'app

---

## 🎨 RÉFÉRENCE VISUELLE

Le prototype HTML de référence (`diaspo-app.html`) contient l'UI complète validée. Pour chaque écran à développer :

1. Ouvrir le prototype dans un navigateur
2. Identifier les composants correspondants
3. Reproduire fidèlement les couleurs, espacements, et animations
4. Les données mockées dans le prototype servent de données de test initiales

**Animations importantes à conserver :**
- `floatCircle` sur la page de login (cercles flottants en arrière-plan)
- `slideInCard` sur la card de login (entrée en glissement)
- `pulseAlert` sur les alertes de paiement (pulsation dorée)
- `pulseDot` sur l'étape active du tracking colis
- Transition de largeur 1.2s sur les barres de progression au chargement
