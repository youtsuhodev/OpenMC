# OpenMC — Launcher Minecraft communautaire

Launcher cracké : le joueur entre un pseudo, choisit sa RAM/version et clique sur Jouer — le jeu se lance et se connecte automatiquement au serveur configuré.

## 1. Configuration

| Constante / réglage | Rôle |
| --- | --- |
| `SERVER_IP` / `SERVER_PORT` (`src/shared/constants.ts`) | Adresse par défaut du serveur. Laisser vide et renseigner l'adresse dans les Réglages du launcher. |
| `DISCORD_CLIENT_ID` | (optionnel) Active la Presence Discord. Voir § 2. |

## 2. Discord Rich Presence (optionnel)

1. <https://discord.com/developers/applications> → **New Application** → `OpenMC`.
2. Copie l'**Application ID** dans `DISCORD_CLIENT_ID`.
3. Dépose une image `mc.png` dans **Rich Presence → Art Assets** pour l'icône affichée.

## 3. Mises à jour automatiques

Les mises à jour passent par **GitHub Releases** : <https://github.com/youtsuhodev/OpenMC>.

### Publication automatique (recommandé)

Un **workflow GitHub Actions** (`.github/workflows/build.yml`) construit et publie les installateurs Windows (.exe), macOS (.dmg) et Linux (.AppImage) automatiquement :

1. Pousse un tag commençant par `v` (ex. `v1.0.1`) :
   ```
   git tag v1.0.1
   git push origin v1.0.1
   ```
2. Le workflow lit la version du tag, construit et publie les installateurs + fichiers `latest*.yml` dans la **release GitHub**.
3. Le launcher détecte la mise à jour et propose de l'installer.

### Build local

| Commande | Résultat |
| --- | --- |
| `npm run dist` | Installeur Windows (`release/OpenMC Setup <version>.exe`) |
| `npm run dist:mac` | Installeur macOS |
| `npm run dist:linux` | AppImage Linux |

L'assistant d'installation NSIS inclut l'image latérale, la page de licence et la personnalisation (`build/`).

## 4. Flux d'actualités

Dans les Réglages du launcher, renseigne l'URL d'un JSON comme :

```json
[
  { "title": "Titre", "date": "2026-08-12", "content": "Contenu..." }
]
```

Sans URL, l'onglet Actualités est vide.

## 5. Commandes

| Commande | Effet |
| --- | --- |
| `npm run dev` | Lance le launcher en développement (rechargement UI). |
| `npm run build` | Compile main + renderer. |
| `npm start` | Lance le launcher (après build). |
| `npm run lint` / `npm run typecheck` | Vérifications. |
| `npm run dist` | Génère les installateurs (Win/macOS/Linux) dans `release/`. |
