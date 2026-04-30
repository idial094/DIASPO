# Guide de déploiement complet — Diaspo App
## De GitHub → VPS (sans nom de domaine, base vide, admin seulement)

---

# PARTIE 1 — PRÉPARER LE CODE ET GITHUB

---

## Étape 1 — Vérifier le .gitignore

Le fichier `.gitignore` à la racine du projet doit exclure les fichiers `.env`
pour ne **jamais envoyer vos secrets sur GitHub**.

Vérifiez que ces lignes sont présentes :

```
.env
.env.local
.env.production
!.env.example
```

✅ C'est déjà configuré dans le projet.

---

## Étape 2 — Créer le dépôt GitHub

1. Ouvrez [github.com](https://github.com) et connectez-vous
2. Cliquez sur le bouton **"New"** (ou `+` → New repository)
3. Remplissez :
   - **Repository name** : `diaspo-app` (ou le nom que vous voulez)
   - **Visibility** : `Private` ← important, votre code est privé
   - **Ne cochez rien** (pas de README, pas de .gitignore, pas de licence)
4. Cliquez **"Create repository"**

GitHub affiche une page avec des instructions. Copiez l'URL du dépôt, qui ressemble à :
```
https://github.com/VOTRE_PSEUDO/diaspo-app.git
```

---

## Étape 3 — Initialiser Git et pousser le code

Ouvrez un terminal sur **votre machine locale**, dans le dossier du projet.

### 3.1 — Initialiser le dépôt git

```bash
cd "/home/benzi/Documents/DIASPO APP"

git init
git branch -M main
```

### 3.2 — Premier commit

```bash
git add .
git commit -m "Initial commit — Diaspo App"
```

### 3.3 — Connecter à GitHub et pousser

```bash
git remote add origin https://github.com/VOTRE_PSEUDO/diaspo-app.git
git push -u origin main
```

> Si GitHub demande vos identifiants, utilisez votre **username GitHub** et un
> **Personal Access Token** (pas votre mot de passe).
>
> Pour créer un token : GitHub → Settings → Developer settings →
> Personal access tokens → Tokens (classic) → Generate new token →
> cochez `repo` → Generate → copiez le token.

### 3.4 — Vérifier sur GitHub

Allez sur `https://github.com/VOTRE_PSEUDO/diaspo-app` — vous devez voir
tous vos fichiers. Les fichiers `.env` ne doivent **pas** apparaître.

---

# PARTIE 2 — PRÉPARER LE SERVEUR VPS

---

## Étape 4 — Se connecter au VPS

Depuis votre machine locale :

```bash
ssh root@VOTRE_IP_VPS
```

> Remplacez `VOTRE_IP_VPS` par l'adresse IP fournie par votre hébergeur
> (ex : `94.23.45.67`).

Si c'est la première connexion, tapez `yes` pour accepter la clé SSH.

---

## Étape 5 — Mettre à jour le serveur

```bash
apt update && apt upgrade -y
apt install -y git curl wget unzip build-essential
```

Attendez la fin (peut prendre 1-2 minutes).

---

## Étape 6 — Installer Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Vérification :
```bash
node -v
# Doit afficher : v20.x.x

npm -v
# Doit afficher : 10.x.x
```

---

## Étape 7 — Installer pnpm

```bash
npm install -g pnpm@9
```

Vérification :
```bash
pnpm -v
# Doit afficher : 9.x.x
```

---

## Étape 8 — Installer PM2 (gestionnaire de processus)

PM2 maintient vos applications en vie et les relance automatiquement
si le serveur redémarre.

```bash
npm install -g pm2
```

Vérification :
```bash
pm2 -v
# Doit afficher un numéro de version
```

---

## Étape 9 — Installer PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
```

Vérification :
```bash
systemctl status postgresql
# Doit afficher : Active: active (running)
```

### 9.1 — Créer la base de données et l'utilisateur

```bash
sudo -u postgres psql
```

Vous entrez dans le shell PostgreSQL. Tapez ces commandes **une par une** :

```sql
CREATE USER diaspo_user WITH PASSWORD 'MOT_DE_PASSE_DB_FORT';
CREATE DATABASE diaspo_prod OWNER diaspo_user;
GRANT ALL PRIVILEGES ON DATABASE diaspo_prod TO diaspo_user;
\q
```

> **Remplacez `MOT_DE_PASSE_DB_FORT`** par un mot de passe solide.
> Générez-en un avec : `openssl rand -base64 20`
> Notez-le — vous en aurez besoin dans le fichier `.env`.

### 9.2 — Tester la connexion

```bash
psql -h localhost -U diaspo_user -d diaspo_prod -c "\conninfo"
# Entrez le mot de passe quand demandé
# Doit afficher : You are connected to database "diaspo_prod"
```

---

## Étape 10 — Installer Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

Vérification :
```bash
systemctl status nginx
# Doit afficher : Active: active (running)

curl http://localhost
# Doit afficher du HTML (page Nginx par défaut)
```

---

# PARTIE 3 — DÉPLOYER LE CODE

---

## Étape 11 — Configurer SSH pour cloner depuis GitHub (VPS)

Sur le VPS, générez une clé SSH pour accéder à votre dépôt privé GitHub :

```bash
ssh-keygen -t ed25519 -C "diaspo-vps" -f ~/.ssh/github_diaspo -N ""
cat ~/.ssh/github_diaspo.pub
```

**Copiez toute la ligne affichée** (commence par `ssh-ed25519 ...`).

Puis sur GitHub :
1. Allez dans votre dépôt → **Settings** → **Deploy keys**
2. Cliquez **Add deploy key**
3. Title : `VPS Production`
4. Key : collez la clé copiée
5. Cochez **Allow write access** : NON (lecture seule suffit)
6. Cliquez **Add key**

Configurez SSH sur le VPS pour utiliser cette clé :

```bash
cat >> ~/.ssh/config <<'EOF'

Host github.com
  IdentityFile ~/.ssh/github_diaspo
  StrictHostKeyChecking no
EOF
```

Testez :
```bash
ssh -T git@github.com
# Doit afficher : Hi VOTRE_PSEUDO! You've successfully authenticated...
```

---

## Étape 12 — Cloner le projet sur le VPS

```bash
mkdir -p /var/www
cd /var/www
git clone git@github.com:VOTRE_PSEUDO/diaspo-app.git diaspo
cd diaspo
```

> Remplacez `VOTRE_PSEUDO` et `diaspo-app` par vos valeurs réelles.

Vérification :
```bash
ls
# Doit afficher : apps  ecosystem.config.cjs  nginx.conf  package.json  packages  ...
```

---

## Étape 13 — Créer les fichiers .env de production

Ces fichiers contiennent vos secrets. Ils ne sont pas sur GitHub —
vous devez les créer manuellement sur le VPS.

### 13.1 — Générer des secrets forts

Sur le VPS, générez des valeurs sécurisées :

```bash
echo "JWT_SECRET:" && openssl rand -base64 48
echo "ADMIN_PASSWORD:" && openssl rand -base64 16
```

**Notez ces valeurs** — vous en aurez besoin dans les étapes suivantes.

### 13.2 — Fichier .env du backend

```bash
nano /var/www/diaspo/apps/backend/.env
```

Copiez-collez ce contenu et **remplacez toutes les valeurs** :

```ini
# Serveur
PORT=4000
HOST=0.0.0.0
NODE_ENV=production

# Base de données
DATABASE_URL=postgresql://diaspo_user:MOT_DE_PASSE_DB_FORT@localhost:5432/diaspo_prod

# JWT — utilisez la valeur générée par openssl ci-dessus
JWT_SECRET=COLLER_JWT_SECRET_ICI
JWT_EXPIRES_IN=8h

# Compte administrateur
ADMIN_EMAIL=admin@diaspo.app
ADMIN_PASSWORD=COLLER_ADMIN_PASSWORD_ICI

# CORS — autorise uniquement votre IP VPS
CORS_ORIGIN=http://VOTRE_IP_VPS

# Stripe (optionnel — laissez vide si vous n'avez pas encore les clés)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CURRENCY=eur
STRIPE_GNF_EUR_RATE=9300

# Cloudinary (optionnel — laissez vide pour désactiver)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Pour sauvegarder dans nano : `Ctrl+O` → `Entrée` → `Ctrl+X`

### 13.3 — Fichier .env du frontend web

```bash
nano /var/www/diaspo/apps/web/.env.production
```

Contenu :

```ini
NEXT_PUBLIC_API_MOCKING=disabled
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_API_BASE_URL=http://VOTRE_IP_VPS
NEXT_PUBLIC_ALLOW_API_MOCK_FALLBACK=false
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

> Remplacez `VOTRE_IP_VPS` par votre adresse IP (ex : `http://94.23.45.67`).

---

## Étape 14 — Installer les dépendances

```bash
cd /var/www/diaspo
pnpm install --frozen-lockfile
```

Attendez la fin (peut prendre 2-5 minutes selon la connexion VPS).

---

## Étape 15 — Créer les tables (migrations)

Cette commande crée toutes les tables dans la base de données **vide**.
Elle n'insère aucune donnée.

```bash
cd /var/www/diaspo/apps/backend
pnpm db:migrate
```

Résultat attendu :
```
Applying migration...
✓ Migrations applied successfully
```

---

## Étape 16 — Créer le compte admin (UNIQUEMENT)

Cette commande crée **seulement le compte administrateur**.
Aucune donnée de test, aucun utilisateur fictif.

```bash
cd /var/www/diaspo/apps/backend
pnpm db:seed:prod
```

Résultat attendu :
```
  Admin account created: admin@diaspo.app
  ─────────────────────────────────────────────
  TOTP secret (save this): ABCDEFGHIJ234567
  OTP Auth URI: otpauth://totp/admin%40diaspo.app?secret=ABCDE...&issuer=Diaspo+App
```

### ⚠️ ACTION CRITIQUE — Sauvegarder le secret TOTP

Le **TOTP secret** affiché est le code que vous devez enregistrer dans
Google Authenticator pour vous connecter à l'interface admin.

**Sans ce code, vous ne pouvez pas vous connecter en admin.**

1. Ouvrez **Google Authenticator** (ou Authy) sur votre téléphone
2. Appuyez sur **+** → **Entrer une clé de configuration**
3. Nom du compte : `Diaspo Admin`
4. Clé : copiez le secret TOTP affiché (ex : `ABCDEFGHIJ234567`)
5. Type : **Basé sur le temps**
6. Appuyez sur **Ajouter**

Vous verrez un code à 6 chiffres se renouveler toutes les 30 secondes.

---

## Étape 17 — Builder les applications

### 17.1 — Builder le backend (TypeScript → JavaScript)

```bash
cd /var/www/diaspo/apps/backend
pnpm build
```

Résultat attendu : un dossier `dist/` avec `server.js` à l'intérieur.

Vérification :
```bash
ls dist/server.js
# Doit afficher le chemin sans erreur
```

### 17.2 — Builder le frontend web (Next.js)

```bash
cd /var/www/diaspo/apps/web
pnpm build
```

Cette étape prend **2 à 5 minutes**. C'est normal.

Résultat attendu :
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
Route (app) ...
```

---

# PARTIE 4 — CONFIGURER ET DÉMARRER

---

## Étape 18 — Configurer Nginx

### 18.1 — Copier la configuration

```bash
cp /var/www/diaspo/nginx.conf /etc/nginx/sites-available/diaspo
```

### 18.2 — Activer le site

```bash
# Créer le lien symbolique pour activer le site
ln -sf /etc/nginx/sites-available/diaspo /etc/nginx/sites-enabled/diaspo

# Désactiver la page par défaut de Nginx
rm -f /etc/nginx/sites-enabled/default
```

### 18.3 — Tester la configuration

```bash
nginx -t
```

Résultat attendu :
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

> Si vous voyez une erreur, vérifiez le fichier avec `cat /etc/nginx/sites-available/diaspo`

### 18.4 — Recharger Nginx

```bash
systemctl reload nginx
```

---

## Étape 19 — Démarrer les applications avec PM2

```bash
cd /var/www/diaspo

# Démarrer les deux applications en mode production
pm2 start ecosystem.config.cjs --env production
```

Vérification :
```bash
pm2 status
```

Résultat attendu :
```
┌──────────────────┬────┬─────────┬──────┬───────┐
│ name             │ id │ status  │ cpu  │ mem   │
├──────────────────┼────┼─────────┼──────┼───────┤
│ diaspo-backend   │ 0  │ online  │ 0%   │ 80mb  │
│ diaspo-web       │ 1  │ online  │ 0%   │ 120mb │
└──────────────────┴────┴─────────┴──────┴───────┘
```

Si une application est en `errored`, consultez les logs :
```bash
pm2 logs diaspo-backend --lines 30
pm2 logs diaspo-web --lines 30
```

---

## Étape 20 — Configurer le démarrage automatique au reboot

Si le VPS redémarre (mise à jour, coupure), PM2 doit relancer les apps
automatiquement.

```bash
# Sauvegarder la liste des apps PM2 actuelles
pm2 save

# Générer le script de démarrage automatique
pm2 startup
```

La commande `pm2 startup` affiche **une ligne de commande à copier-coller**.
Elle ressemble à :

```
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

**Copiez et exécutez cette commande exacte** (elle est différente pour chaque serveur).

Vérification :
```bash
systemctl status pm2-root
# Doit afficher : Active: active (enabled)
```

---

# PARTIE 5 — VÉRIFICATION FINALE

---

## Étape 21 — Tester l'application

### Test 1 — API backend

```bash
curl http://localhost:4000/api/health
# Attendu : {"status":"ok"} ou réponse JSON
```

### Test 2 — API via Nginx (depuis le VPS)

```bash
curl http://localhost/api/health
# Même réponse que ci-dessus
```

### Test 3 — Frontend web

```bash
curl -I http://localhost
# Attendu : HTTP/1.1 200 OK
```

### Test 4 — Depuis votre navigateur

Ouvrez dans votre navigateur :
```
http://VOTRE_IP_VPS
```

Vous devez voir la page d'accueil de Diaspo App.

### Test 5 — Connexion admin

1. Allez sur `http://VOTRE_IP_VPS/admin/login`
2. Email : `admin@diaspo.app` (ou celui défini dans `.env`)
3. Mot de passe : celui défini dans `ADMIN_PASSWORD`
4. Code TOTP : le code à 6 chiffres de Google Authenticator

---

# PARTIE 6 — MAINTENANCE ET MISES À JOUR

---

## Comment mettre à jour l'application

Quand vous faites des modifications sur votre machine locale et poussez
sur GitHub, voici comment mettre à jour le VPS :

```bash
# 1. Se connecter au VPS
ssh root@VOTRE_IP_VPS

# 2. Aller dans le projet
cd /var/www/diaspo

# 3. Récupérer le nouveau code
git pull origin main

# 4. Installer les nouvelles dépendances (si package.json a changé)
pnpm install --frozen-lockfile

# 5. Si de nouvelles migrations existent
cd apps/backend && pnpm db:migrate && cd ../..

# 6. Rebuilder le backend
cd apps/backend && pnpm build && cd ../..

# 7. Rebuilder le web
cd apps/web && pnpm build && cd ../..

# 8. Redémarrer sans coupure
cd /var/www/diaspo
pm2 reload all
```

## Commandes PM2 utiles

```bash
pm2 status                      # État des applications
pm2 logs                        # Tous les logs en temps réel
pm2 logs diaspo-backend         # Logs backend uniquement
pm2 logs diaspo-web             # Logs web uniquement
pm2 restart diaspo-backend      # Redémarrer le backend
pm2 restart diaspo-web          # Redémarrer le web
pm2 reload all                  # Redémarrage sans coupure (zero-downtime)
pm2 stop all                    # Arrêter tout
pm2 delete all                  # Supprimer tous les processus PM2
```

## Configurer le pare-feu (recommandé)

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

Seuls les ports **22 (SSH)** et **80 (HTTP)** seront accessibles depuis l'extérieur.
Les ports 3000 et 4000 resteront internes.

---

# RÉSOLUTION DES PROBLÈMES FRÉQUENTS

---

## Problème : app PM2 en statut "errored"

```bash
pm2 logs diaspo-backend --lines 50
```

Causes fréquentes :
- Variables manquantes dans `.env` → vérifiez `apps/backend/.env`
- Build manquant → relancez `pnpm build` dans `apps/backend`
- Port déjà utilisé → `lsof -i :4000` pour voir quel process l'occupe

## Problème : Nginx retourne 502 Bad Gateway

```bash
# Vérifier que PM2 tourne
pm2 status

# Vérifier que le backend répond
curl http://localhost:4000/api/health

# Vérifier la config Nginx
nginx -t
cat /var/log/nginx/error.log | tail -20
```

## Problème : Migration échoue

```bash
# Vérifier que la variable DATABASE_URL est correcte
cat /var/www/diaspo/apps/backend/.env | grep DATABASE_URL

# Tester la connexion PostgreSQL manuellement
psql postgresql://diaspo_user:MOT_DE_PASSE@localhost:5432/diaspo_prod -c "SELECT 1"
```

## Problème : Code TOTP perdu

Si vous avez perdu l'accès à Google Authenticator :

```bash
sudo -u postgres psql diaspo_prod

-- Supprimer l'admin existant
DELETE FROM users WHERE id = 'u-admin-001';
\q

-- Recréer le compte admin (un nouveau TOTP sera généré)
cd /var/www/diaspo/apps/backend
pnpm db:seed:prod
```

Scannez le nouveau QR code dans Google Authenticator.

## Problème : "git pull" échoue — permission denied

```bash
# Vérifier que la clé SSH est chargée
ssh -T git@github.com

# Si ça échoue, vérifier la config SSH
cat ~/.ssh/config
```

---

# RÉCAPITULATIF DES PORTS ET SERVICES

| Service      | Port interne | Accessible depuis l'extérieur |
|--------------|-------------|-------------------------------|
| Nginx        | 80          | ✅ Oui (via IP)               |
| Next.js web  | 3000        | ❌ Non (via Nginx seulement)  |
| Fastify API  | 4000        | ❌ Non (via Nginx seulement)  |
| PostgreSQL   | 5432        | ❌ Non (local seulement)      |

---

# RÉCAPITULATIF DES FICHIERS À CRÉER SUR LE VPS

Ces fichiers **ne sont pas sur GitHub** (secrets) — à créer manuellement :

| Fichier | Description |
|---------|-------------|
| `/var/www/diaspo/apps/backend/.env` | Secrets backend (DB, JWT, admin) |
| `/var/www/diaspo/apps/web/.env.production` | Config frontend web (API URL) |
