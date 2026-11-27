# Kape't Balay Frontend (React + Vite)

The React application entry points are `src/main.jsx` and `src/App.jsx`.
Feature screen entry components are organized in `src/pages/`, reusable screen hosting is in `src/components/`, and shared API configuration is in `src/services/api.js`.

The existing HTML/CSS/JavaScript screens are retained under `public/legacy/` so their existing event handlers, styling, and API behavior are not discarded during this structural conversion. Each React page component currently hosts its corresponding preserved screen. These are React page entry components, but the screen internals have not yet been rewritten as native React components.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
