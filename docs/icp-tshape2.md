# T-Shape 2 / Artemis SDR — Ideal customer profile (Notebook LM brief)

This document is the **in-repo execution brief** for the **AZ / CO / NM** prospecting patch. It distills the original plan: use it for call prep, list curation, and import column design. It is **not** legal or medical advice, and it is **not** a substitute for **Artemis-approved** marketing or compliance review before you cite third-party or competitor material on live calls.

---

## Target business types

- Med spas and **medical aesthetics**
- **Wellness** centers
- **Weight loss** clinics (including programs that advertise **GLP-1** / **semaglutide**-class offerings)

## Firmographic filter

- Prefer roughly **1–50 employees**; **avoid very large chains (200+)** where possible — independent and regional groups often have shorter decision paths.
- **Territory**: **Arizona**, **Colorado**, **New Mexico**.

## Decision-maker hypotheses

When researching or skimming a site, prioritize finding:

- **Owner**, **Founder**
- **Medical Director**
- **NP** / **APRN**

Use these as **hypotheses** for outreach, not assumed facts until verified.

## Green flags (qualification signals)

When researching each lead, record which apply (short text is fine; you can use pipe-separated codes in CSV such as `GF=GLP1|BODY|REVIEWS`).

| Signal | Why it matters |
|--------|----------------|
| **GLP-1 / semaglutide / Ozempic** or branded **medical weight loss** visible in ads or menu | Strong “why now” alignment with **post–weight-loss body** and tightening narratives — position carefully, without unsubstantiated outcomes. |
| Listed on **CoolSculpting** or **Emsculpt** provider finders | Already investing in **body contouring** stack. |
| **Second location** recently opened | Growth mode. |
| **≥4.5 stars** and **≥50 reviews** on Google (or comparable) | Established patient flow. |
| **Medical oversight** (**NP / MD / DO**) visible on site | Useful framing prerequisite for **Class II**-class device conversations — still subject to approved claims only. |

## Core hooks (for 1–2 sentence Notes per row)

Rotate hooks; do **not** paste long walls of text into Notes.

- **GLP-1 demand anchor**: Internal briefing may reference third-party framing (e.g. McKinsey-linked narratives about aesthetics demand). **Do not** cite statistics or vendors on calls unless wording is **approved** and **current**.
- **“Ozempic body” pivot**: Demand shifting toward **skin laxity / cellulite** after significant weight change — position **non-invasive tightening** lanes without promising specific results.
- **Trend / awareness hook**: Any RealSelf or category growth statistics you keep in Notebook LM — **approved wording only** on outbound or calls.

## Financial / risk-removal angles (Notes teasers only)

Topics such as first-year subsidy framing, pre-booked pipeline, payback horizons, Section 179, launch ROI — use only as **short teasers** in Notes **after** you confirm what is **current and approved** for your patch.

## Competitor-aware tidbits (site-evidence only)

Only use angles when **their own site/menu** shows the modality. Keep brief and non-defamatory unless cleared.

| If they show… | Direction (brief) |
|---------------|---------------------|
| CoolSculpting | Contrast **consumables / cryo / PAH** themes vs **non-cryo** positioning — **no** lawsuit or stat numbers unless approved. |
| Emsculpt NEO | Muscle/fat vs **laxity/cellulite** gap for large weight-loss patient journeys. |
| Morpheus8 | Invasiveness / downtime / tips vs **non-invasive** positioning. |
| TruSculpt / Venus | Vendor stability / support — **no** bankruptcy or delist claims unless verified current and cleared. |

## Gatekeeper / opener patterns (optional)

At most **one line** in Notes: pattern-disrupt intro, referral-style ask, or GLP-1 surface opener — pick one voice and stay consistent with compliance.

## Tech credibility bullets (optional single phrase)

Examples: multi-modality story, EU utilization narrative, thermal monitoring language — **no specific efficacy promises** unless they appear verbatim in approved collateral.

---

## Research methodology (public sources)

Layer sources; confirm phone/email on **primary site** or **official booking** when possible.

1. **Google Maps** (manual): e.g. “medical weight loss clinic [city]”, “GLP-1 semaglutide clinic [city]”, “med spa body contouring [city]”. Pull name / city / phone / ratings, then **leave Maps** to validate on the website.
2. **Vagaro** (and similar directories): name + city + phone → confirm on site.
3. **Facebook** public business pages only: hours, phone, website — **no** logged-in scraping.
4. **Practice website**: footer contact, `/contact`, booking widgets, provider / medical director pages.

**Do not**: bulk-automate Maps; invent emails; drive tooling against logged-in Notebook LM or Facebook sessions.

---

## CSV schema ↔ Artemis app

Recommended header row (see [`samples/tshape2-prospects-southwest.csv`](../samples/tshape2-prospects-southwest.csv); dev server also serves it at **`/seeds/tshape2-prospects-southwest.csv`**):

| Column | Typical role in importer |
|--------|---------------------------|
| `company` | Company |
| `first_name`, `last_name` | First / Last name |
| `phone` | Mobile / primary phone |
| `email` | Email (leave blank if not public) |
| `city`, `state`, `green_flags`, `dm_target`, `source_url` | Extra (context) — **on import**, prospecting-shaped files **append** these to **Notes** with labels when mapped as Extra |
| `notes` | Notes (call prep) |

Import with **First row is header** checked. Use **Apply prospecting seed preset** if column names differ but column order matches the seed layout.

---

## What this brief explicitly does not guarantee

- A public email on every row.
- Permission to state McKinsey, RealSelf, FDA, competitor lawsuit, or bankruptcy figures **without** matching **approved** collateral.
- Hundreds of unverified leads in one batch.

---

## Related files

- Seed list (repo): [`samples/tshape2-prospects-southwest.csv`](../samples/tshape2-prospects-southwest.csv)
- Same file while dev server is running: **`/seeds/tshape2-prospects-southwest.csv`** (empty state offers a download link)
- Column mapping logic: [`src/lib/mapping.ts`](../src/lib/mapping.ts)
