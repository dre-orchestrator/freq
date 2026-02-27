# FRAMEWORK.md — FREQ AI Website

## Choice: Vanilla HTML/CSS/JS

**Reason:** Zero build tooling risk — a working vanilla site beats a broken framework build, and all six pages with the interactive simulation can be fully implemented without a build step.

## Structure

- `index.html` → `/`
- `platform.html` → `/platform`
- `solutions/barge-drafting.html` → `/solutions/barge-drafting`
- `about.html` → `/about`
- `team.html` → `/team`
- `contact.html` → `/contact`
- `styles.css` → Global design system
- `simulation.js` → Interactive barge drafting simulation
- `public/og-image.svg` → OG image (1200×630)
- `public/favicon.svg` → Favicon (F mark in purple)
- `vercel.json` → Routing configuration for clean URLs
