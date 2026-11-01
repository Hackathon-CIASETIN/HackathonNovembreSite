# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- **Never run any git commit action** (`git commit`, `git push`, amend, merge, rebase, tag) unless the user explicitly asks for it in that message.
- The site is entirely in **French**: all user-facing copy, comments and identifiers. Write new content in French.

## What this is

Static site for the ASETIN Buildathon (29 November 2026), deployed on GitHub Pages from `main`, root folder. No dependencies, no build step, no tests, no linter. All content, comments and identifiers are in **French** (Québécois: « clavardage », « courriel »). Keep new code and copy in French.

## Run locally

```bash
python3 -m http.server 8000   # http://localhost:8000
```

## Architecture

- Two standalone pages, each with its own visual theme:
  - `index.html` — GeoCities / Newgrounds-2005 three-column layout, styled by `assets/css/retro.css` (holds the ASETIN palette as `:root` tokens).
  - `sante.html` — "Santé" category presented as a thermal-paper fax from the fictional sponsor IGEA. Uses `assets/css/fax.css` only (not `retro.css`), driven by `assets/js/fax.js` (sheet-by-sheet print animation, fake printer search dialog, Web Audio fax tone on click).
- Each JS file is a vanilla IIFE (`'use strict'`, `var`, no modules) that finds its DOM by `id`.
- `assets/js/clavardage.js` + `assets/css/clavardage.css` = the AsetinBot 2000 chat widget, included on both pages. It **injects its own DOM**; including the two files is all a page needs. The joke: a scripted bot (`REPLIQUES` array, last line repeats) "transfers to a human", and the message really goes to an organizer. Transport is picked in the `CONFIG` object at the top of the file: `demo` (default, sends nothing), `formsubmit`, `web3forms`, `discord` (webhook URL is public in client code), or `tawk` (loads Tawk.to, hides its bubble, reuses the retro UI).
- `assets/js/compteur.js` — shared visitor counter via Abacus (`GET /hit/<ESPACE>/<CLE>`), falling back to a per-browser local count if the service fails. Changing `CLE` resets the counter; `BASE` is a cosmetic offset. Not yet verified against the live service.
- Images are hand-written SVGs in `assets/img/`.

## Constraints

- Keep every path **relative**: the site must work both at a domain root and under `https://<user>.github.io/<repo>/`.
- `index.html` stays at repo root; keep `.nojekyll`.
- External calls must stay `https://` (Pages serves HTTPS; mixed content is blocked).
- The fax page and chat widget respect `prefers-reduced-motion` (CSS media query + `reduit` flag in `fax.js`); keep that for new animations.

## Open items (from README)

Second category (vie étudiante: fictional sponsor, right-rail ad, page; the "EN CONSTRUCTION" card already exists on the home page), real ticketing link (`TODO` in `index.html`), exact campus location.
