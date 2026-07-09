# Krav Maga Training

Application web de suivi d'entraînement musculation orientée sports de combat (krav maga). Mobile-first, dark theme, données stockées en local sur l'appareil (aucun serveur, aucun compte).

Stack : React + Vite, TailwindCSS v4, `localStorage` pour la persistance.

## Fonctionnalités

- **Planning** — cycle de 8 jours (A / repos / B / repos / C / repos / D / repos) et planning daté du 07/07 au 21/07/2026.
- **Séances A, B, C, D + Bras** — fiches d'exercices en accordéon avec tableaux séries/charges/reps, tags CHAUFFE / TRAVAIL / OPTION, badge repos et note d'exécution.
- **Nutrition** — journée type détaillée (8 repas) + supplémentation.
- **Carnet** — saisie libre après chaque séance (charge, reps, séries, note), historique groupé par date, export CSV, tout persistant en `localStorage`.
- **Règles** — faire / ne pas faire / signaux d'alerte / progression des charges.

## Développement local

Prérequis : [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm run dev
```

L'app est servie sur `http://localhost:5173` (accessible aussi depuis un téléphone sur le même réseau via l'IP locale affichée dans le terminal, ex. `http://192.168.x.x:5173`).

## Build de production

```bash
npm run build
```

Génère le dossier `dist/` avec des chemins d'assets relatifs (`base: './'` dans `vite.config.js`), ce qui permet de déployer l'app depuis n'importe quel sous-répertoire (GitHub Pages projet, Netlify, ou simple hébergement statique).

Pour prévisualiser le build localement :

```bash
npm run preview
```

## Déploiement sur Netlify

**Option 1 — via l'interface Netlify (drag & drop)**
1. `npm run build`
2. Glisser-déposer le dossier `dist/` sur [app.netlify.com/drop](https://app.netlify.com/drop)

**Option 2 — via un dépôt Git connecté**
1. Pousser le projet sur GitHub/GitLab/Bitbucket
2. Sur Netlify : "Add new site" → "Import an existing project"
3. Build command : `npm run build`
4. Publish directory : `dist`

## Déploiement sur GitHub Pages

**Option 1 — avec le paquet `gh-pages`**

```bash
npm install -D gh-pages
```

Ajouter dans `package.json` :

```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

Puis :

```bash
npm run deploy
```

Le site sera publié sur `https://<utilisateur>.github.io/<repo>/`.

**Option 2 — avec GitHub Actions**

Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Puis activer GitHub Pages sur la branche `gh-pages` dans les paramètres du dépôt.

## Notes sur les données

- Toutes les données du Carnet sont stockées dans le `localStorage` du navigateur utilisé — elles ne sont donc pas partagées entre appareils ou navigateurs différents.
- Vider le cache/les données de site du navigateur effacera l'historique du Carnet. Utiliser le bouton "Exporter CSV" pour en garder une copie externe.
