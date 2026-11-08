# UI Library Catalog

A searchable, filterable catalog of UI libraries to help you choose the right **framework, design toolkit, component kit or animation library** for your project, from Bootstrap and Tailwind to MUI, shadcn/ui, Vuetify, Ionic, anime.js, GSAP and more.

It's a zero-dependency static site (plain HTML, CSS and ES modules), so there's no build step.

## Features

- **72 libraries in 9 categories:** CSS frameworks, Tailwind component kits, component libraries, headless primitives, Web Components, mobile & cross-platform, animation & motion, icons, and charts.
- **Filters** for category, framework (React, Vue, Angular, Svelte, Solid, Web Components, React Native, Flutter, plain HTML, vanilla JS), styling approach, must-have features (TypeScript, accessibility, theming, SSR, dark mode), design language (Material, Fluent, Carbon, Ant Design…) and license.
- **Search** across names, descriptions, tags and use cases.
- **Compare** up to 4 libraries side by side.
- **Help me choose:** a 4-question wizard that ranks recommendations and explains why.
- **Shareable URLs:** filters and comparisons are stored in the URL hash.
- Light/dark theme, responsive layout, keyboard accessible.

## Run locally

ES modules need to be served over HTTP (opening `index.html` from disk won't work):

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080. Any static server works (`npx serve`, for example).

## Add or update a library

All data lives in [`data/libraries.js`](data/libraries.js). Append an entry:

```js
{
  id: "my-lib",                       // unique, lowercase kebab-case
  name: "My Lib",
  category: "component-library",      // a key of `categories`
  url: "https://mylib.dev",
  repo: "https://github.com/me/my-lib", // "" if closed source
  description: "One or two sentences, under 200 characters.",
  frameworks: ["react", "vue"],        // keys of `frameworks`
  styling: "styled",                   // a key of `stylings`
  designLanguage: "Material",          // Material, Fluent, Custom, Themeable, Unstyled, None…
  features: ["typescript", "a11y", "theming", "ssr", "dark-mode"], // keys of `featureLabels`
  license: "MIT",
  tags: ["forms", "enterprise"],
  bestFor: "Short answer to: when should I pick this?",
}
```

Then validate:

```bash
npm run validate
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Deploy

`.github/workflows/pages.yml` publishes the site to GitHub Pages on every push to `main`. Enable it under **Settings → Pages → Source: GitHub Actions**. `.github/workflows/validate.yml` checks the data on every push and pull request.

## Project layout

```
index.html              page markup
assets/styles.css       styles (light/dark tokens)
assets/app.js           filtering, search, compare, wizard
data/libraries.js       the catalog data
scripts/validate-data.mjs  data validator
```
