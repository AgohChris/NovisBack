# NovisBack - Système de Gestion d'Espaces de Coworking

Une application web complète pour la gestion d'espaces de coworking, développée avec Next.js 15, NextAuth, Prisma et SQLite.

## 🚀 Fonctionnalités

- **Authentification sécurisée** avec NextAuth (JWT)
- **Gestion des utilisateurs** avec inscription et connexion
- **Gestion des réservations** d'espaces
- **Interface moderne** avec TanStack Table et React Modal
- **Base de données SQLite** avec Prisma ORM
- **Styles responsive** avec Tailwind CSS

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Git

## 🛠 Installation

1. **Cloner le repository**
```bash
git clone <url-du-repo>
cd NovisBack
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**

Créer un fichier `.env` à la racine (un fichier exemple est déjà fourni) :
```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production

# JWT Secret
JWT_SECRET=your-jwt-secret-change-this-in-production

# Email (Resend) - Optionnel
RESEND_API_KEY=your-resend-api-key
```

4. **Initialiser la base de données**
```bash
# Créer la base de données et appliquer les migrations
npm run db:setup

# Ou séparément :
npx prisma migrate dev
npm run db:seed
```

## 👤 Utilisateur par défaut

Après le seed de la base de données, vous pouvez vous connecter avec :
- **Email** : admin@example.com
- **Mot de passe** : password123

## 📦 Scripts disponibles

```bash
# Développement
npm run dev          # Démarre le serveur de développement sur http://localhost:3000

# Base de données
npm run db:push      # Push le schéma sans migration
npm run db:seed      # Exécute le script de seed
npm run db:studio    # Ouvre Prisma Studio (interface graphique BDD)
npm run db:setup     # Migration + seed en une commande

# Production
npm run build        # Build l'application pour la production
npm run start        # Démarre le serveur de production
```

## 🏗 Structure du projet

```
NovisBack/
├── prisma/
│   ├── schema.prisma    # Schéma de la base de données
│   ├── seed.ts          # Script de seed
│   └── dev.db           # Base de données SQLite
├── src/
│   └── app/
│       ├── api/         # Routes API
│       │   ├── auth/    # Authentification NextAuth
│       │   └── reservations/ # API des réservations
│       ├── login/       # Page de connexion
│       ├── register/    # Page d'inscription
│       ├── profile/     # Page profil avec gestion des réservations
│       └── layout.tsx   # Layout principal
├── types/
│   └── next-auth.d.ts   # Types TypeScript pour NextAuth
└── package.json
```

## 🔐 Système d'authentification

L'application utilise NextAuth avec :
- **Stratégie JWT** pour les sessions
- **Credentials Provider** pour l'authentification email/mot de passe
- **Sessions enrichies** avec les données utilisateur (id, name, firstname, role)
- **Protection des routes API** avec `getServerSession`

## 📊 Modèles de données principaux

### User
- id, email, name, firstname, password (hashé), role
- Relations : réservations, notifications, messages, etc.

### Espace
- Types : SALLE_REUNION, OPEN_SPACE, BUREAU_PRIVE, etc.
- Tarifs : horaire, journalier, hebdomadaire, mensuel
- Équipements : wifi, écran, projecteur, etc.

### Reservation
- Lien entre User et Espace
- Types : heure, journée, semaine, mois
- Statuts : en_attente, confirmee, annulee, terminee

## 🎨 Interface utilisateur

- **Page de connexion** : `/login`
- **Page d'inscription** : `/register`
- **Page profil** : `/profile` (protégée)
  - Affichage des informations utilisateur
  - Tableau des réservations avec TanStack Table
  - Modal de création de réservation
  - Styles CSS modules personnalisés

## 🔧 Configuration avancée

### Prisma Studio
Pour visualiser et éditer les données :
```bash
npm run db:studio
```

### Modifier le schéma de base de données
1. Éditer `prisma/schema.prisma`
2. Créer une nouvelle migration :
   ```bash
   npx prisma migrate dev --name description-du-changement
   ```

### Ajouter de nouveaux utilisateurs de test
Modifier `prisma/seed.ts` et relancer :
```bash
npm run db:seed
```

## 🐛 Dépannage

### Erreur de migration
Si vous avez une erreur de migration, supprimez la base de données et recommencez :
```bash
rm prisma/dev.db
rm -rf prisma/migrations
npm run db:setup
```

### Erreur d'authentification
Vérifiez que :
- Les variables d'environnement sont correctement définies
- Le serveur est bien démarré sur le bon port
- Les cookies sont activés dans votre navigateur

## 🚀 Déploiement

Pour déployer en production :

1. Configurer les variables d'environnement de production
2. Utiliser une base de données de production (PostgreSQL recommandé)
3. Build l'application :
   ```bash
   npm run build
   npm run start
   ```

## 📝 Licence

Ce projet est sous licence MIT.

---

Développé avec ❤️ par [Votre nom]