# Guide de deploiement VPS sans nom de domaine

Ce guide est adapte a ton cas exact:

- pas de domaine
- 3 apps deja actives sur le VPS
- deploiement Diaspo App via IP + ports dedies
- pas de donnees de test en prod

Ports proposes (hors 3000/3001/4000):

- Web: `3105`
- API backend: `4105`

---

## 1) Creer le depot GitHub et pousser le projet

Depuis ta machine locale:

```bash
cd "/home/benzi/Documents/DIASPO APP"
git status
```

Si c'est un nouveau repo:

```bash
git init
git add .
git commit -m "Initial Diaspo App"
git branch -M main
git remote add origin <URL_GITHUB>
git push -u origin main
```

Si le repo existe deja:

```bash
git add .
git commit -m "Prepare VPS deployment without domain"
git push origin main
```

Important:

- ne jamais commit `.env`, `.env.local`, secrets
- garder les cles Stripe/JWT uniquement dans le VPS

---

## 2) Preparer le VPS (une seule fois)

Connexion:

```bash
ssh <USER>@<IP_VPS>
```

Installer prerequis:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2
```

Verifier:

```bash
node -v
pnpm -v
pm2 -v
```

---

## 3) Pull du code sur VPS

```bash
sudo mkdir -p /var/www/diaspo-app
sudo chown -R $USER:$USER /var/www/diaspo-app
cd /var/www/diaspo-app
git clone <URL_GITHUB> .
pnpm install --frozen-lockfile
```

---

## 4) Configurer les variables d'environnement

## 4.1 Backend `apps/backend/.env`

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=4105
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
JWT_SECRET=CHANGE_ME_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=8h
ADMIN_EMAIL=admin@diaspo.local
ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD
CORS_ORIGIN=http://<IP_VPS>:3105
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CURRENCY=eur
STRIPE_GNF_EUR_RATE=9300
```

## 4.2 Web `apps/web/.env.production`

```env
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_API_MOCKING=disabled
NEXT_PUBLIC_ALLOW_API_MOCK_FALLBACK=false
NEXT_PUBLIC_API_BASE_URL=http://<IP_VPS>:4105
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

## 4.3 Mobile (build) `apps/mobile/.env`

```env
EXPO_PUBLIC_USE_REAL_API=true
EXPO_PUBLIC_ALLOW_API_MOCK_FALLBACK=false
EXPO_PUBLIC_API_BASE_URL=http://<IP_VPS>:4105
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

---

## 5) Base de donnees: migration uniquement

Executer:

```bash
cd /var/www/diaspo-app
pnpm --filter @diaspo/backend db:migrate
```

Ne jamais executer en prod:

```bash
# INTERDIT EN PROD
pnpm --filter @diaspo/backend db:seed
```

---

## 6) Build et demarrage des services

Build:

```bash
cd /var/www/diaspo-app
pnpm --filter @diaspo/backend build
pnpm --filter @diaspo/web build
```

Demarrage PM2 backend:

```bash
cd /var/www/diaspo-app
pm2 start "pnpm --filter @diaspo/backend start" --name diaspo-backend
```

Demarrage PM2 web sur port 3105:

```bash
cd /var/www/diaspo-app/apps/web
PORT=3105 pm2 start "pnpm start" --name diaspo-web
```

Sauvegarder PM2:

```bash
pm2 save
pm2 startup
```

Verifier:

```bash
pm2 ls
pm2 logs diaspo-backend --lines 100
pm2 logs diaspo-web --lines 100
```

---

## 7) Ouvrir les ports firewall (IP:port)

Si `ufw` est actif:

```bash
sudo ufw allow 3105/tcp
sudo ufw allow 4105/tcp
sudo ufw status
```

Test direct:

- Web: `http://<IP_VPS>:3105`
- API: `http://<IP_VPS>:4105`

---

## 8) Stripe sans domaine: point critique

Stripe webhook en production exige une URL HTTPS publique valide.
Sans domaine, tu as 3 options:

1. **Recommande**: acheter un domaine (meme minimal) et activer HTTPS.
2. Utiliser un tunnel HTTPS (Cloudflare Tunnel / ngrok) pour exposer `4105`.
3. Temporaire: tester paiements sans webhook stable (non recommande prod).

Si tunnel HTTPS:

- URL webhook Stripe = `https://<url-tunnel>/api/payments/webhook`
- mettre a jour `STRIPE_WEBHOOK_SECRET`
- redemarrer backend

---

## 9) Checklist "sans donnees demo"

- `db:migrate` execute
- `db:seed` non execute
- `NEXT_PUBLIC_API_MOCKING=disabled`
- `NEXT_PUBLIC_ALLOW_API_MOCK_FALLBACK=false`
- `EXPO_PUBLIC_ALLOW_API_MOCK_FALLBACK=false`
- creation de vrais comptes possible
- aucune donnee de test visible au premier lancement

---

## 10) Procedure de mise a jour (deploy suivant)

```bash
cd /var/www/diaspo-app
git pull origin main
pnpm install --frozen-lockfile
pnpm --filter @diaspo/backend build
pnpm --filter @diaspo/web build
pnpm --filter @diaspo/backend db:migrate
pm2 restart diaspo-backend
pm2 restart diaspo-web
pm2 logs diaspo-backend --lines 50
pm2 logs diaspo-web --lines 50
```

---

## 11) Verification des conflits avec tes 3 apps existantes

```bash
pm2 ls
sudo ss -lntp | rg "3105|4105|3000|3001|4000"
```

Resultat attendu:

- `diaspo-web` ecoute sur `3105`
- `diaspo-backend` ecoute sur `4105`
- aucune collision avec les autres apps

---

## 12) Recommandation forte

Sans domaine, la plateforme peut tourner via IP:port, mais pour un usage reel:

- prends un domaine
- active HTTPS
- configure webhook Stripe proprement

C'est la seule voie fiable pour paiements en production.

# Guide de deploiement complet sur VPS (avec plusieurs apps deja en ligne)

Ce guide est concu pour ton cas:

- un seul VPS
- deja 3 applications en fonctionnement
- deploiement Diaspo App sans casser l'existant
- ports differents de `3000`, `3001`, `4000`
- sans donnees de test (pas de seed)

---

## 1) Strategie de ports et architecture

Pour eviter tout conflit, on reserve:

- Web Next.js: `3105`
- Backend Fastify: `4105`
- PostgreSQL: service managé externe recommande (ou local VPS si tu preferes)

Recommande en production:

- Nginx en frontal (80/443)
- les apps Node ecoutent en local (`127.0.0.1:3105` et `127.0.0.1:4105`)
- certificats SSL via Let's Encrypt

---

## 2) Creation du depot GitHub et push initial

Depuis ton poste local:

```bash
cd "/home/benzi/Documents/DIASPO APP"
git status
```

Si le repo n'est pas encore initialise:

```bash
git init
git add .
git commit -m "Initial Diaspo App monorepo"
git branch -M main
git remote add origin <URL_GITHUB_DU_REPO>
git push -u origin main
```

Si repo deja existant:

```bash
git add .
git commit -m "Prepare VPS deployment"
git push origin main
```

Important:

- Verifie `.gitignore` (jamais de `.env` dans Git)
- Ne pousse jamais de cles Stripe/JWT/DB

---

## 3) Preparation du VPS (une seule fois)

Connexion:

```bash
ssh <user>@<ip_vps>
```

Mise a jour paquets:

```bash
sudo apt update && sudo apt upgrade -y
```

Installer dependances:

```bash
sudo apt install -y git curl nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2
```

Verifier versions:

```bash
node -v
pnpm -v
pm2 -v
nginx -v
```

---

## 4) Recuperer le projet sur VPS

Choix propre de dossier:

```bash
sudo mkdir -p /var/www/diaspo-app
sudo chown -R $USER:$USER /var/www/diaspo-app
cd /var/www/diaspo-app
git clone <URL_GITHUB_DU_REPO> .
```

Installer dependances:

```bash
pnpm install --frozen-lockfile
```

---

## 5) Variables d'environnement (production sans mock)

## 5.1 Backend `apps/backend/.env`

```env
NODE_ENV=production
PORT=4105
HOST=127.0.0.1
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
JWT_SECRET=CHANGE_ME_LONG_RANDOM_SECRET_64_CHARS_MIN
JWT_EXPIRES_IN=8h
ADMIN_EMAIL=admin@tondomaine.com
ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD
CORS_ORIGIN=https://app.tondomaine.com
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CURRENCY=eur
STRIPE_GNF_EUR_RATE=9300
```

## 5.2 Web `apps/web/.env.production`

```env
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_API_MOCKING=disabled
NEXT_PUBLIC_ALLOW_API_MOCK_FALLBACK=false
NEXT_PUBLIC_API_BASE_URL=https://api.tondomaine.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

## 5.3 Mobile (build prod)

```env
EXPO_PUBLIC_USE_REAL_API=true
EXPO_PUBLIC_ALLOW_API_MOCK_FALLBACK=false
EXPO_PUBLIC_API_BASE_URL=https://api.tondomaine.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

---

## 6) Base de donnees: migration uniquement

Executer uniquement:

```bash
pnpm --filter @diaspo/backend db:migrate
```

Interdit en prod:

```bash
# NE PAS EXECUTER
pnpm --filter @diaspo/backend db:seed
```

---

## 7) Build des applications

```bash
cd /var/www/diaspo-app
pnpm --filter @diaspo/backend build
pnpm --filter @diaspo/web build
```

---

## 8) Lancer les services avec PM2

## 8.1 Backend (port 4105)

```bash
cd /var/www/diaspo-app
pm2 start "pnpm --filter @diaspo/backend start" --name diaspo-backend
```

## 8.2 Web (port 3105)

Next utilise `PORT` pour `next start`.

```bash
cd /var/www/diaspo-app/apps/web
PORT=3105 pm2 start "pnpm start" --name diaspo-web
```

Sauvegarder PM2:

```bash
pm2 save
pm2 startup
```

Verifier:

```bash
pm2 ls
pm2 logs diaspo-backend --lines 100
pm2 logs diaspo-web --lines 100
```

---

## 9) Exposition via Nginx (recommande)

## 9.1 Config API `api.tondomaine.com`

```nginx
server {
    server_name api.tondomaine.com;

    location / {
        proxy_pass http://127.0.0.1:4105;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 9.2 Config WEB `app.tondomaine.com`

```nginx
server {
    server_name app.tondomaine.com;

    location / {
        proxy_pass http://127.0.0.1:3105;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activation:

```bash
sudo nano /etc/nginx/sites-available/diaspo-api
sudo nano /etc/nginx/sites-available/diaspo-web
sudo ln -s /etc/nginx/sites-available/diaspo-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/diaspo-web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 10) Pointage DNS (IP du VPS)

Chez ton fournisseur DNS:

- `A` record `api.tondomaine.com` -> `<IP_VPS>`
- `A` record `app.tondomaine.com` -> `<IP_VPS>`

Attends propagation DNS.

---

## 11) SSL HTTPS (Let's Encrypt)

```bash
sudo certbot --nginx -d api.tondomaine.com -d app.tondomaine.com
```

Verifier renouvellement auto:

```bash
systemctl status certbot.timer
```

---

## 12) Stripe webhook en production

Dans Stripe Dashboard:

- endpoint: `https://api.tondomaine.com/api/payments/webhook`
- evenements:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

Puis mets a jour `STRIPE_WEBHOOK_SECRET` dans `apps/backend/.env` et redemarre backend:

```bash
pm2 restart diaspo-backend
pm2 logs diaspo-backend --lines 100
```

---

## 13) Verification finale (checklist stricte)

- `https://app.tondomaine.com` accessible
- `https://api.tondomaine.com` repond
- login diaspora/agence/admin OK
- creation compte reelle OK
- paiement Stripe OK
- webhook Stripe recu (logs backend)
- aucune donnee demo initiale
- fallback mock desactive:
  - web: `NEXT_PUBLIC_ALLOW_API_MOCK_FALLBACK=false`
  - mobile: `EXPO_PUBLIC_ALLOW_API_MOCK_FALLBACK=false`

---

## 14) Procedure de mise a jour continue (deploy suivant)

Sur VPS:

```bash
cd /var/www/diaspo-app
git pull origin main
pnpm install --frozen-lockfile
pnpm --filter @diaspo/backend build
pnpm --filter @diaspo/web build
pnpm --filter @diaspo/backend db:migrate
pm2 restart diaspo-backend
pm2 restart diaspo-web
pm2 logs diaspo-backend --lines 50
pm2 logs diaspo-web --lines 50
```

---

## 15) Coexistence avec tes 3 autres apps

Regles importantes:

- Ne pas reutiliser leurs ports
- Utiliser des noms PM2 uniques (`diaspo-backend`, `diaspo-web`)
- Utiliser des vhosts Nginx dedies par domaine/sous-domaine
- Verifier les collisions:

```bash
sudo ss -lntp | rg "3105|4105|3000|3001|4000"
pm2 ls
```

---

## 16) Option sans domaine (IP + port)

Possible pour test, mais non recommande en production:

- Web: `http://<IP_VPS>:3105`
- API: `http://<IP_VPS>:4105`

Dans ce cas:

- ouvre les ports dans firewall (`ufw`)
- configure `NEXT_PUBLIC_API_BASE_URL` avec IP:port
- pas de SSL propre sans domaine

---

## 17) Securite minimale

- 2FA sur GitHub/VPS/Stripe
- sauvegardes DB quotidiennes
- rotation des secrets si doute
- ne jamais commit les `.env`
- restreindre CORS au domaine web final

