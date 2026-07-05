# PRODUCT.md — Hotel ERP (Zellige Hotels)

## Register

**Product** (primary): an ERP for hotel operations — dashboards, CRUD tables, booking
lifecycle, invoicing, tasks. Design serves the task.
**Brand** (secondary, scoped): the public landing + hotel browsing + auth pages are a
small brand surface — editorial, sober, identity-carrying. The register can be
overridden per task for those routes.

## Users & purpose

- **Hotel staff** (admin, manager, receptionist): run daily operations — confirm
  bookings, check guests in/out, invoice, assign housekeeping tasks. They live in
  data tables and need speed, density and zero ambiguity.
- **Hotel clients**: browse hotels, search availability, book, cancel, see invoices.
  Occasional users; clarity over density.
- **Recruiters/developers** (meta-audience): this is a portfolio piece for
  github.com/AyChEs. The code and the interface both need to read as professional.

## Brand personality

"Artesano del software útil" (AyChEs): sober, precise, crafted. The visual identity
is **zellige/arabesque** — Moroccan geometric tilework — expressed through a deep
teal + gold palette and 8-point-star pattern used as low-opacity texture on brand
surfaces (never as decoration inside data UI).

Three words: **crafted, calm, trustworthy.**

## Color strategy

**Committed**: deep teal carries the navigation shell, hero and footer (30–40% of
the surface). Content areas sit on a near-white tinted toward the brand teal
(OKLCH hue ~200, never warm cream). Gold is an accent for primary emphasis,
selection and ornament only. Terracotta is reserved for destructive/error.

## Anti-references (never look like)

- SaaS-cream landing templates (warm beige bg + gradient text + eyebrow kickers).
- Generic admin dashboards (Bootstrap-admin look, identical stat-card grids).
- Orientalist kitsch: the arabesque is geometric and architectural, not thematic
  clip-art. No camels, no lanterns, no cursive "Arabian" fonts.

## Accessibility

WCAG AA: body text ≥4.5:1, large text ≥3:1, visible focus rings everywhere,
`prefers-reduced-motion` honored (pattern stays, motion stops). Forms always
label + inline error; nothing conveyed by color alone.

## Strategic principles

1. **The ornament lives at the edges.** Arabesque texture on shells (sidebar, hero,
   footer, auth backdrop); the working canvas is quiet and dense.
2. **Earned familiarity in the ERP.** Standard affordances (tables, tabs, badges,
   side nav); the craft shows in tuning, not invention. Display serif never appears
   in buttons, labels or data.
3. **One component vocabulary.** Same button/badge/field/table grammar on every
   screen; states (hover/focus/disabled/loading/empty/error) always designed.
4. **Bilingual-ready copy.** UI copy in Spanish; code and API in English.
