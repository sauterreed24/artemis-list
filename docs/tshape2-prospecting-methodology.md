# T-Shape 2 Southwest Prospecting Methodology

This file documents how `samples/tshape2-prospects-southwest.csv` was expanded for Artemis SDR calling.

## Scope

- Territory: Arizona, Colorado, and New Mexico.
- Target rows: 150 public-source-backed prospects.
- Business types: med spas, medical aesthetics clinics, wellness centers, body-contouring studios, and medical weight-loss or GLP-1 clinics.
- Best-fit decision makers: owner, founder, medical director, NP/APRN, clinic director, practice manager, or operations lead.

## Source Rules

- Use public sources only: practice websites, contact pages, public booking pages, public business profiles, and public directory listings.
- Prefer a primary practice website or official contact page when available.
- Public directories are acceptable when they expose a phone, location, service mix, or named provider that the practice site does not expose clearly.
- Do not include guessed emails, private social profiles, logged-in pages, or scraped Google Maps data.
- Leave name fields blank unless a public source identifies a relevant provider or decision-maker.

## Green-Flag Codes

- `GLP1`: GLP-1, semaglutide, tirzepatide, or medical weight-loss services are visible.
- `BODY`: Body contouring, sculpting, fat reduction, or similar services are visible.
- `CELLULITE`: Cellulite treatment language is visible.
- `SKIN_TIGHTENING`: Skin tightening, firming, laxity, RF, or comparable services are visible.
- `COOLSCULPTING`: CoolSculpting or CoolSculpting Elite is visible.
- `EMSCULPT`: Emsculpt, Emsculpt Neo, EMS, muscle toning, or similar body technology is visible.
- `MORPHEUS8`: Morpheus8 or RF microneedling is visible.
- `MEDICAL_OVERSIGHT`: MD, DO, NP, RN, PA, medical director, or clinician-led language is visible.
- `REVIEWS`: The source exposes strong public review volume or rating signals.
- `MULTI_LOCATION`: Multiple locations or regional/national footprint is visible.
- `GROWTH`: New location, expansion, launch, or opening signal is visible.

## Call-Safe Positioning

- Keep outbound notes short and specific to the public source.
- Good openers: post-weight-loss body confidence, cellulite or skin-texture questions, staff education, consult scripting, device-stack gaps, non-invasive body services, and follow-up after GLP-1 milestones.
- Do not cite unapproved statistics, unverified competitor claims, lawsuit references, or specific clinical outcomes on live calls.
- If a prospect already has CoolSculpting, Emsculpt, Morpheus8, or another body platform, treat that as buying intent and ask what gap remains in their current stack.

## Maintenance

- Edit `samples/tshape2-prospects-southwest.csv` as the canonical seed.
- Run `npm run prospects:sync` to mirror it into `public/seeds/tshape2-prospects-southwest.csv`.
- Run `npm run prospects:validate` before committing to check row count, header order, required fields, duplicate phones, duplicate company/location rows, and mirror drift.
