# Alanya 💬

Messagerie + appels. Front React/TypeScript en évolution.

## ✨ Fonctionnalités

| Section | Routes |
|---------|--------|
| Auth | `/welcome`, `/login`, `/sign-in` (avec OTP) |
| Dashboard | `/dashboard` - Stats, appels récents, profil |
| Chats | `/chats`, `/chats/:id`, `/chats/:id/info` |
| Appels | `/calls`, `/calls/new`, `/calls/:id` (audio/vidéo) |
| Settings | `/settings` - Modification profil |

## 🛠️ Stack

React 18 · TypeScript · Vite · React Router DOM

## 🚀 Lancer

```bash
npm install
npm run dev
```

Copie ensuite les variables d'environnement:

```bash
cp .env.example .env.local
```

Variables disponibles:

- `VITE_API_BASE_URL`: URL du backend (laisser vide en mode prototype)
- `VITE_DATA_MODE`: `auto` (defaut), `prototype`, `api`

## 📦 Build

```bash
npm run build
npm run preview
```

## 🎯 Derniers ajouts

- Navigation intelligente après appel (retour à la page d'origine)
- Page info dynamique (groupe vs conversation privée)
- Dashboard interactif (profil, rappels)
- Refactoring des types TypeScript
- Centralisation data dans des services (`chats`, `calls`, `dashboard`)
- Mode d'execution des donnees configurable via `VITE_DATA_MODE`

## 🔄 Fonctionnement recommande (avant backend complet)

1. Developper l'UI et les parcours en `VITE_DATA_MODE=prototype`.
2. Ajouter/maintenir les types API dans `src/services`.
3. Brancher endpoint par endpoint dans les services sans toucher aux pages.
4. Tester l'integration en `VITE_DATA_MODE=auto`, puis forcer `api` quand le backend est stable.

## 🚧 Todo

Backend (WebSocket, auth réelle), création de chats, recherche, notifications.

---

*Projet ENSPY 2025/2026*
