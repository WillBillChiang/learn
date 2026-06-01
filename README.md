# Learn Something New

A quiet, deepening field guide to ideas worth knowing.

## What it is

Learn Something New is a small static site for unhurried curiosity. Pick a
category, then progress through six layers of depth, from a first glance to a
working understanding. Each topic is hand-written to reward attention rather
than scrolling.

## Local preview

The site is plain HTML, CSS, and JavaScript with no build step. Serve it from
the repository root with either of:

```
python3 -m http.server 8000
```

```
npx serve
```

Then open the printed URL in a browser.

## GitHub Pages deployment

The simplest path uses Pages' built-in "deploy from a branch" mode:

1. Push the repository to GitHub.
2. In the repository, go to **Settings -> Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select
   the `main` branch and the `/ (root)` folder, then save.
4. Wait roughly one minute for the first deploy to finish.
5. Visit `https://<username>.github.io/<repo>/`.

An optional GitHub Actions workflow is included at
`.github/workflows/pages.yml` for users who prefer Actions-based deploys.

## Project structure

```
.
├── index.html
├── 404.html
├── css/
├── js/
├── data/
├── assets/
├── SPEC.md
├── README.md
├── LICENSE
├── .nojekyll
├── .gitignore
└── .github/
    └── workflows/
        └── pages.yml
```

## Adding new topics

Topics live as data files under `data/`. See `SPEC.md` for the full content
model, the six-layer depth structure, and the rules each topic should follow.

## License

MIT. See `LICENSE`.
# learn
