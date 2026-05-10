# Artemis Calling Lists

**A fast, local-only calling desk for prospecting Artemis T-Shape 2 buyers.**

[Open the live app](https://sauterreed24.github.io/artemis-list/) on a computer, tablet, or phone. No GitHub account is needed.

Direct links:

- App: [https://sauterreed24.github.io/artemis-list/](https://sauterreed24.github.io/artemis-list/)
- Southwest T-Shape 2 prospect CSV: [https://sauterreed24.github.io/artemis-list/seeds/tshape2-prospects-southwest.csv](https://sauterreed24.github.io/artemis-list/seeds/tshape2-prospects-southwest.csv)

## What This Is

Artemis Calling Lists turns a CSV into a focused cold-call cockpit. It is built for one job: help a caller move through qualified prospects quickly while keeping the pitch grounded in real source context.

The included T-Shape 2 Southwest seed is a 150-row prospecting list for Arizona, Colorado, and New Mexico med spas, medical aesthetics practices, wellness clinics, body-contouring studios, and GLP-1 or medical weight-loss clinics. Each row is structured for a caller: phone, location, target decision-maker role, public source URL, green-flag buying signals, and a concise call hook.

## Why It Exists

T-Shape 2 is a non-invasive body-shaping platform. The best outbound targets are clinics already talking about body contouring, cellulite, skin tightening, post-weight-loss body confidence, GLP-1 follow-up, or medical aesthetics growth.

This app keeps that context visible while dialing:

- who to ask for,
- why the practice fits,
- what public signal earned the call,
- what opener is safe and specific,
- where the source came from.

## How To Use It

1. Open [the live app](https://sauterreed24.github.io/artemis-list/).
2. Download the built-in Southwest prospect CSV from the empty screen, or use the direct CSV link above.
3. Click **Import CSV**.
4. Turn on **First row is header**.
5. Confirm the prospecting seed mapping.
6. Start calling from the board.
7. Update notes as you learn who owns the buying decision.
8. Export the list when you want a backup.

Everything runs in the browser. There is no login, no server database, and no CRM sync. Your working call notes are stored in that browser's local storage until you export or clear them.

## What Is In The Seed

The canonical CSV lives at [`samples/tshape2-prospects-southwest.csv`](samples/tshape2-prospects-southwest.csv) and is mirrored into [`public/seeds/tshape2-prospects-southwest.csv`](public/seeds/tshape2-prospects-southwest.csv) for the live app.

Columns:

`company, first_name, last_name, phone, email, city, state, green_flags, dm_target, notes, source_url`

Green-flag codes include:

- `GLP1`
- `BODY`
- `CELLULITE`
- `SKIN_TIGHTENING`
- `COOLSCULPTING`
- `EMSCULPT`
- `MORPHEUS8`
- `MEDICAL_OVERSIGHT`
- `REVIEWS`
- `MULTI_LOCATION`
- `GROWTH`

The methodology and call-safe language are documented in [`docs/tshape2-prospecting-methodology.md`](docs/tshape2-prospecting-methodology.md).

## Development

```bash
npm ci
npm run prospects:validate
npm run lint
npm run build
npm run dev
```

Useful scripts:

- `npm run prospects:sync` mirrors the canonical sample CSV into the public seed path.
- `npm run prospects:validate` checks row count, header order, required fields, state coverage, phone normalization, duplicate phones, duplicate company/location rows, approved green flags, source URLs, and sample/public drift.
- `npm run lint` checks source quality.
- `npm run build` creates the deployable static app in `dist/`.

## Deployment

The app deploys to GitHub Pages from `main` using `.github/workflows/pages.yml`.

Public URL after deployment:

[https://sauterreed24.github.io/artemis-list/](https://sauterreed24.github.io/artemis-list/)
