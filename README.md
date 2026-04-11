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

## 🚧 Todo

Backend (WebSocket, auth réelle), création de chats, recherche, notifications.

---

*Projet ENSPY 2025/2026*
