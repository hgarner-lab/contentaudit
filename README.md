# Mastercard Content Atlas

A production-oriented web application prototype for auditing, organizing and activating Mastercard public English-language cybersecurity content.

## What is included

- Searchable content inventory with filters, sorting, selection and CSV export.
- Content detail view with source traceability, AI-inferred metadata and human approval states.
- Cybersecurity topic map with density, gaps and related content.
- Audit findings for stale, thin, overlapping, missing metadata and inaccessible content.
- Campaign planning pack with recommended assets, proof points, content angles and LinkedIn copy.
- Source registry for domains, sitemaps, reports, social handles, executive profiles and syndicated URLs.
- Seed data based on current public Mastercard pages and source URLs.

## Run locally

This prototype is dependency-free. Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Prototype notes

The app is intentionally structured so Mastercard is a configured client rather than hard-coded product logic. The data model in `src/data.js` includes optional performance fields for later GA, Search Console, social or video integrations, but the MVP does not depend on them.
