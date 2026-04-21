# Alanya

Alanya est une application web de messagerie et d'appels, realisee comme projet academique ENSPY 2025/2026.

Le projet contient actuellement le client web. Il permet deja de naviguer dans l'application, creer un compte en mode prototype, se connecter, consulter les conversations, ouvrir une discussion, simuler des appels et modifier le profil utilisateur.

## Etat actuel

Le client web est utilisable sans backend grace au mode prototype. Les donnees sont conservees localement dans le navigateur, ce qui permet de tester les parcours principaux pendant que le backend est encore en developpement.

Fonctionnalites deja presentes :

- page d'accueil ;
- inscription et connexion ;
- verification OTP simulee pendant l'inscription ;
- tableau de bord ;
- liste des conversations ;
- detail d'une conversation ;
- creation locale de conversation ;
- page d'informations d'une conversation ;
- historique et lancement d'appels audio/video simules ;
- parametres du profil ;
- mode clair/sombre.

## Lancer le projet

Installer les dependances :

```bash
npm install
```

Demarrer l'application :

```bash
npm run dev
```

Puis ouvrir l'adresse affichee dans le terminal, generalement :

```text
http://localhost:5173
```

## Configuration

Le fichier `.env.example` donne les variables disponibles :

```env
VITE_API_BASE_URL=
VITE_DATA_MODE=auto
```

En attendant le backend, il est conseille d'utiliser :

```env
VITE_DATA_MODE=prototype
```

Modes disponibles :

- `prototype` : utilise les donnees locales du navigateur ;
- `auto` : essaie l'API si elle existe, puis revient au mode prototype si besoin ;
- `api` : prepare l'utilisation du backend, mais tous les endpoints ne sont pas encore branches.

## Parcours disponibles

| Section | Pages |
| --- | --- |
| Accueil | `/`, `/welcome` |
| Authentification | `/login`, `/signup`, `/forgot-password` |
| Tableau de bord | `/dashboard` |
| Conversations | `/chats`, `/chats/new`, `/chats/:chatId`, `/chats/:chatId/info` |
| Appels | `/calls`, `/calls/new`, `/calls/:callId` |
| Parametres | `/settings` |

## Backend

Le client web est pret a etre relie progressivement a un backend via les services dans `src/services`.

Pour l'instant, le backend complet reste a finaliser :

- authentification reelle ;
- stockage des utilisateurs ;
- stockage des conversations et messages ;
- appels et notifications en temps reel ;
- WebSocket ou autre mecanisme temps reel ;
- recherche et gestion avancee des contacts.

## Commandes utiles

Lancer en developpement :

```bash
npm run dev
```

Verifier la compilation :

```bash
npm run build
```

Previsualiser la version de production :

```bash
npm run preview
```

## Organisation rapide

```text
app/             Pages de l'application
src/components/  Composants partages
src/data/        Donnees locales du mode prototype
src/services/    Services prepares pour l'API
src/styles/      Styles globaux
```

## Note

Le projet est dans un bon etat pour une demonstration du client web. Le plus important maintenant est de garder l'interface stable, puis de connecter le backend endpoint par endpoint sans casser les parcours deja fonctionnels.
