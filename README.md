
# RZMedical

RZMedical est une plateforme e-commerce de produits médicaux composée de trois applications :

- `web` : site public destiné aux clients ;
- `admin-panel` : interface de gestion réservée aux administrateurs ;
- `backend` : API REST Node.js/Express, avec PostgreSQL et Prisma.

Le dépôt contient également la configuration Docker Compose pour démarrer PostgreSQL, l'API et le panneau d'administration.

## Architecture

```text
RZMedical/
├── web/             # Site client Next.js (port 3000 par défaut)
├── admin-panel/     # Back-office Next.js (port 3001 en local, 3000 avec Docker)
├── backend/         # API Express + Prisma (port 4000)
├── docker-compose.yml
└── README.md
```

Flux applicatif :

```text
Navigateur
	├──> web ou admin-panel (Next.js)
	└──> backend :4000 (API REST)
						  └──> PostgreSQL :5432
```

Les fichiers envoyés par l'API sont servis sous `/uploads`. Le site public consomme l'API via `NEXT_PUBLIC_API_URL` et l'interface d'administration utilise la même API.

## Prérequis

- Node.js 20 ou plus récent ;
- npm ;
- PostgreSQL 16, ou Docker Desktop ;
- Git.

Pour le développement de l'assistant conversationnel du site, une clé Groq est également nécessaire (`GROQ_API_KEY`).

## Démarrage rapide avec Docker

Depuis la racine du dépôt :

```bash
docker compose up --build
```

Services disponibles :

| Service | URL | Rôle |
| --- | --- | --- |
| PostgreSQL | `localhost:5432` | Base de données |
| Backend | `http://localhost:4000` | API REST |
| Admin | `http://localhost:3000` | Back-office |

Le conteneur backend applique les migrations Prisma avant de démarrer. Les données PostgreSQL sont conservées dans le volume Docker `pgdata`.

Pour arrêter les services :

```bash
docker compose down
```

Pour supprimer également les données locales de PostgreSQL :

```bash
docker compose down -v
```

> Le service `web` n'est pas déclaré dans le `docker-compose.yml` actuel. Lancez-le séparément, ou ajoutez un service dédié si vous souhaitez containeriser le site public.

## Installation locale

### 1. Démarrer PostgreSQL

Vous pouvez utiliser uniquement la base fournie par Docker :

```bash
docker compose up -d db
```

En local, utilisez une URL PostgreSQL équivalente à :

```text
-
```

### 2. Installer et configurer le backend

```bash
cd backend
npm install
```

Créez `backend/.env` :

```dotenv
-
PORT=4000
JWT_SECRET="changez-cette-valeur-en-developpement"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER=""
EMAIL_PASS=""
ADMIN_EMAIL=-
ADMIN_PASSWORD="changez-ce-mot-de-passe"
```

Initialisez la base et le client Prisma :

```bash
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

Démarrez l'API en mode développement :

```bash
npm run dev
```

L'API est alors disponible à l'adresse `http://localhost:4000`. La route racine `GET /` renvoie un message de disponibilité.

### 3. Démarrer le site public

Dans un autre terminal :

```bash
cd web
npm install
```

Créez `web/.env.local` :

```dotenv
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
GROQ_API_KEY="votre-cle-groq"
GROQ_MODEL="openai/gpt-oss-120b"
```

Puis lancez Next.js :

```bash
npm run dev
```

Ouvrez `http://localhost:3000`. Si l'admin Docker occupe déjà ce port, utilisez par exemple :

```bash
npm run dev -- -p 3002
```

et définissez `NEXT_PUBLIC_SITE_URL="http://localhost:3002"`.

### 4. Démarrer l'admin en local

```bash
cd admin-panel
npm install
npm run dev
```

L'admin local utilise le port `3001` et doit pouvoir joindre `http://localhost:4000/api`.

## Commandes disponibles

Les commandes doivent être exécutées depuis le dossier de l'application concernée.

### Backend

| Commande | Description |
| --- | --- |
| `npm run dev` | Lance l'API avec rechargement automatique via `tsx` et `nodemon` |
| `npm run build` | Compile TypeScript vers `dist` |
| `npm start` | Démarre la version compilée |
| `npm run db:seed` | Exécute le seed Prisma |
| `npx prisma generate` | Régénère le client Prisma |
| `npx prisma migrate deploy` | Applique les migrations existantes |
| `npx prisma migrate dev` | Crée/applique une migration en développement |
| `npx prisma studio` | Ouvre l'interface d'inspection de la base |

### Web et Admin

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur Next.js de développement |
| `npm run build` | Build de production |
| `npm start` | Démarre le build de production |
| `npm run lint` | Lance ESLint |

## Fonctionnalités principales

### Catalogue

- catégories, sous-catégories et marques ;
- produits avec référence, prix, stock, disponibilité, remise et date d'expiration ;
- images, vidéo, mots-clés et fiche technique ;
- affichage des produits récents, en promotion et recherche par référence.

### Comptes et commandes

- authentification client et administrateur ;
- gestion du profil client ;
- panier et création de commandes ;
- suivi des commandes et statuts `EN_ATTENTE`, `PAYEE`, `EXPEDIEE`, `LIVREE` et `ANNULEE` ;
- factures et génération de documents PDF côté application.

### Administration et support

- statistiques du tableau de bord ;
- gestion des clients, du catalogue et du contenu du site ;
- notifications et boîte de réception ;
- tickets de support et messages ;
- téléversement de fichiers via `/api/upload`.
hello 
### Assistant conversationnel

Le site expose la route Next.js `POST /api/chat`. Cette route appelle Groq côté serveur ; la clé `GROQ_API_KEY` ne doit donc jamais être préfixée par `NEXT_PUBLIC_` ni exposée au navigateur.

## API REST

Toutes les routes métier sont préfixées par `/api` :

| Préfixe | Domaine |
| --- | --- |
| `/api/categories` | Catégories |
| `/api/subcategories` | Sous-catégories |
| `/api/brands` | Marques |
| `/api/products` | Produits |
| `/api/upload` | Téléversements |
| `/api/stats` | Statistiques |
| `/api/auth` | Authentification administrateur |
| `/api/client-auth` | Authentification client |
| `/api/clients` | Gestion des clients |
| `/api/orders` | Commandes |
| `/api/invoices` | Factures |
| `/api/notifications` | Notifications |
| `/api/inbox` | Boîte de réception |
| `/api/site-content` | Annonces et bannières |
| `/api/support` | Support client |

Les routes privées utilisent un token JWT envoyé dans l'en-tête `Authorization` sous la forme `Bearer <token>`. Les opérations d'administration doivent être protégées par un compte administrateur.

## Base de données

Le schéma Prisma se trouve dans `backend/prisma/schema.prisma`. Les migrations versionnées sont dans `backend/prisma/migrations/` et le client généré est écrit dans `backend/generated/prisma/`.

Après une modification du schéma :

```bash
cd backend
npx prisma migrate dev --name description-de-la-modification
npx prisma generate
```

Ne modifiez pas manuellement une migration déjà appliquée sur un environnement partagé. Créez une nouvelle migration.

## Sécurité et configuration

- Ne commitez jamais `backend/.env`, `web/.env.local` ou une clé Groq.
- Remplacez les valeurs par défaut de `JWT_SECRET`, `ADMIN_PASSWORD` et des identifiants email avant toute utilisation réelle.
- Les valeurs présentes dans Docker Compose sont adaptées au développement local uniquement.
- Configurez un SMTP réel pour l'OTP, le support et la boîte de réception email.
- Vérifiez les origines CORS, les hôtes autorisés Next.js et les domaines d'images avant un déploiement public.
- Les données de production doivent utiliser un secret PostgreSQL et un volume sauvegardé.

## Dépannage

### Le backend ne se connecte pas à PostgreSQL

Vérifiez que PostgreSQL est démarré et que `DATABASE_URL` utilise `localhost` hors Docker, mais `db` depuis le réseau Docker Compose.

```bash
docker compose ps
docker compose logs db
```

### Le frontend affiche une erreur réseau

Vérifiez `NEXT_PUBLIC_API_URL`, puis testez :

```bash
curl http://localhost:4000/
```

Après une modification d'une variable `NEXT_PUBLIC_*`, redémarrez le serveur Next.js.

### Les emails ou OTP ne partent pas

Contrôlez `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER` et `EMAIL_PASS`. Sans identifiants SMTP, les fonctions email ne peuvent pas fonctionner.

### Le port 3000 est déjà utilisé

L'admin Docker écoute sur `3000`, tandis que le site public Next.js utilise aussi `3000` par défaut. Arrêtez l'un des services ou démarrez le site avec un autre port, par exemple `npm run dev -- -p 3002`.

## Tests et qualité

Avant une modification importante, exécutez au minimum :

```bash
cd backend
npm run build

cd ../web
npm run lint

cd ../admin-panel
npm run lint
```

Les tests backend existants sont dans `backend/tests/` et peuvent être exécutés selon la configuration du projet avec Node.js.

## Documentation complémentaire

- [Plan d'implémentation](implementation_plan_v2.md)
- [Schéma Prisma](backend/prisma/schema.prisma)
- [Configuration Docker Compose](docker-compose.yml)
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Prisma](https://www.prisma.io/docs)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
