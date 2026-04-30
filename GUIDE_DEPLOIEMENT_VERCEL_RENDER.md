# Guide complet de deploiement (Vercel + Render)

Ce guide deploie la plateforme Diaspo App en mode **sans donnees de test**.

Objectif:
- Web sur **Vercel**
- Backend + PostgreSQL sur **Render**
- Paiements via **Stripe**
- **Migration uniquement** de la base (`db:migrate`)
- **Jamais** de seed (`db:seed`)

---

## 0) Prerequis

- Compte GitHub
- Compte Render
- Compte Vercel
- Compte Stripe
- `pnpm` installe en local
- Projet fonctionnel en local

Verification locale rapide:

```bash
pnpm --filter @diaspo/backend typecheck
pnpm --filter @diaspo/web typecheck
pnpm --filter @diaspo/mobile typecheck
```

---

## 1) Creer le repository GitHub (depuis zero)

### 1.1 Creer le repo sur GitHub

1. Ouvre GitHub -> `New repository`
2. Nom recommande: `diaspo-app`
3. Visibilite: private (recommande)
4. Ne coche pas "Add README" si ton dossier en a deja un
5. Clique `Create repository`

### 1.2 Initialiser le repo local et push

Depuis la racine du projet:

```bash
cd "/home/benzi/Documents/DIASPO APP"
git init
git add .
git commit -m "Initial monorepo setup"
git branch -M main
git remote add origin <URL_GITHUB_DU_REPO>
git push -u origin main
```

Important:
- Verifie que `.env`, `.env.local`, secrets ne sont pas commits.
- Si besoin, ajoute-les dans `.gitignore` avant `git add .`.

---

## 2) Preparer la configuration "sans mock" pour staging/prod

Tu as deja les flags. En staging/prod, ils doivent etre strictement:

### Web
- `NEXT_PUBLIC_USE_REAL_API=true`
- `NEXT_PUBLIC_API_MOCKING=disabled`
- `NEXT_PUBLIC_ALLOW_API_MOCK_FALLBACK=false`

### Mobile
- `EXPO_PUBLIC_USE_REAL_API=true`
- `EXPO_PUBLIC_ALLOW_API_MOCK_FALLBACK=false`

Regle d'or:
- Si `ALLOW_API_MOCK_FALLBACK=false`, aucune donnee mock ne doit etre affichee.

---

## 3) Deployer la base PostgreSQL sur Render

### 3.1 Creer la base

1. Render Dashboard -> `New` -> `PostgreSQL`
2. Nom: `diaspo-postgres-prod` (ou staging)
3. Region: proche de tes utilisateurs
4. Plan: selon ton budget
5. Creer

Render te donnera un `Internal Database URL` et souvent un `External Database URL`.

### 3.2 Recupere les variables

Tu utiliseras:
- `DATABASE_URL` (backend)

---

## 4) Deployer le backend sur Render (Web Service)

### 4.1 Creer le service

1. Render -> `New` -> `Web Service`
2. Connecte ton repo GitHub `diaspo-app`
3. Root directory: vide (racine monorepo)
4. Environment: `Node`
5. Build Command:

```bash
pnpm install --frozen-lockfile && pnpm --filter @diaspo/backend build
```

6. Start Command:

```bash
pnpm --filter @diaspo/backend start
```

### 4.2 Variables d'environnement backend

Dans Render > Service > Environment, ajoute:

- `NODE_ENV=production`
- `PORT=4000`
- `HOST=0.0.0.0`
- `DATABASE_URL=<url postgres render>`
- `JWT_SECRET=<secret long, aleatoire>`
- `JWT_EXPIRES_IN=8h`
- `CORS_ORIGIN=https://<ton-domaine-vercel>`
- `ADMIN_EMAIL=<email_admin_reel>`
- `ADMIN_PASSWORD=<mot_de_passe_admin_fort>`
- `STRIPE_SECRET_KEY=sk_live_...` (ou `sk_test_...` en staging)
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `STRIPE_CURRENCY=eur`
- `STRIPE_GNF_EUR_RATE=9300`

Optionnel upload:
- `CLOUDINARY_CLOUD_NAME=...`
- `CLOUDINARY_API_KEY=...`
- `CLOUDINARY_API_SECRET=...`

### 4.3 Migrer la base (et uniquement ca)

Apres premier deploy backend, lance une commande one-off Render shell:

```bash
pnpm --filter @diaspo/backend db:migrate
```

Interdictions:
- Ne pas lancer `pnpm --filter @diaspo/backend db:seed`

### 4.4 Verifier le backend

Checks:
- Le service Render est `Live`
- Endpoint de sante repond (si expose)
- Logs backend sans erreur critique au demarrage

---

## 5) Configurer Stripe proprement

### 5.1 Cles

- Backend: `STRIPE_SECRET_KEY` (secret)
- Frontend web/mobile: publishable key (`pk_live...` ou `pk_test...`)

### 5.2 Webhook Stripe -> Render backend

Dans Stripe Dashboard:

1. Developers -> Webhooks -> `Add endpoint`
2. URL:

`https://<backend-render-domain>/api/payments/webhook`

3. Evenements minimum:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

4. Recupere le secret webhook et mets-le dans Render:
- `STRIPE_WEBHOOK_SECRET=whsec_...`

5. Redeploy backend apres ajout/maj des variables.

---

## 6) Deployer le web sur Vercel

### 6.1 Creer le projet Vercel

1. Vercel -> `Add New...` -> `Project`
2. Import GitHub repo `diaspo-app`
3. Configure:
   - Framework: Next.js (detecte automatiquement)
   - Root Directory: `apps/web`
   - Build command: auto (ou `pnpm build`)
   - Install command: `pnpm install --frozen-lockfile`

### 6.2 Variables d'environnement web (Vercel)

Ajoute:

- `NEXT_PUBLIC_USE_REAL_API=true`
- `NEXT_PUBLIC_API_MOCKING=disabled`
- `NEXT_PUBLIC_ALLOW_API_MOCK_FALLBACK=false`
- `NEXT_PUBLIC_API_BASE_URL=https://<backend-render-domain>`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` (ou `pk_test_...` en staging)

Puis redeploy.

### 6.3 Mettre a jour CORS backend

Une fois l'URL Vercel connue:

- Mets `CORS_ORIGIN=https://<vercel-domain>`
- Redeploy backend

---

## 7) Verification fonctionnelle complete (checklist)

## 7.1 Auth & roles
- Login diaspora OK
- Login agence OK
- Login admin OK
- Logout OK

## 7.2 Donnees
- Aucune donnee de demonstration par defaut
- Creation de comptes reelle possible
- Operations reelles ecrites en base

## 7.3 Paiements Stripe
- Creation PaymentIntent OK
- Paiement reussi met le statut a `paid`
- Paiement echoue met le statut a `failed`
- Webhook recu dans logs backend

## 7.4 Anti-mock
- `NEXT_PUBLIC_API_MOCKING=disabled`
- `NEXT_PUBLIC_ALLOW_API_MOCK_FALLBACK=false`
- `EXPO_PUBLIC_ALLOW_API_MOCK_FALLBACK=false`
- Aucun fallback mock visible en UI

---

## 8) Pipeline de deploiement conseille

Ordre recommande:

1. Push GitHub `main`
2. Render DB deja cree
3. Deploy backend Render
4. `db:migrate` (une seule commande)
5. Config Stripe webhook
6. Deploy web Vercel
7. Mettre `CORS_ORIGIN` sur domaine web final
8. Smoke tests complets

---

## 9) Strategie staging avant production

Recommande:
- Un backend Render staging + DB staging
- Un projet Vercel staging (Preview)
- Cles Stripe test en staging
- Cles Stripe live seulement en production
- Meme regle stricte: pas de seed en staging/prod

---

## 10) Erreurs frequentes et correction rapide

### "403/401 partout"
- Verifie les tokens/session
- Verifie `NEXT_PUBLIC_USE_REAL_API=true`
- Verifie base URL backend correcte

### Le web appelle encore des mocks
- Verifie:
  - `NEXT_PUBLIC_API_MOCKING=disabled`
  - `NEXT_PUBLIC_ALLOW_API_MOCK_FALLBACK=false`

### Paiement Stripe non confirme
- Verifie `STRIPE_WEBHOOK_SECRET`
- Verifie l'URL webhook Stripe
- Verifie evenements actives
- Verifie logs backend sur `/api/payments/webhook`

### CORS bloque
- `CORS_ORIGIN` doit etre exactement le domaine Vercel
- Redeploy backend apres changement

---

## 11) Securite minimale obligatoire

- Secrets uniquement en variables d'environnement (jamais dans Git)
- `JWT_SECRET` fort et unique
- Rotation des cles si exposees
- HTTPS partout
- Sauvegardes DB actives
- Access control des comptes Render/Vercel/GitHub active (2FA recommande)

---

## 12) Resume ultra-court

- GitHub repo -> push
- Render Postgres -> Render backend
- `db:migrate` uniquement
- Stripe webhook vers Render
- Vercel web avec variables anti-mock
- Validation complete sans seed ni donnees demo

