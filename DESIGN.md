# DESIGN.md — Zellige Hotels ERP

Visual system for `frontend/`. Tokens live in `frontend/src/styles/theme.css`
(Tailwind 4 CSS-first `@theme`).

## Theme

Deep teal ("glazed tile") + gold ("brass inlay") on a teal-tinted near-white
("glaze"). The arabesque 8-point star tessellation appears only on shell surfaces:
sidebar, hero, footer, auth backdrops — never behind data.

## Palette (OKLCH-derived)

| Token | Value | Role |
|---|---|---|
| `glaze-50` | `#f4f8f8` (oklch .97 .006 200) | body background |
| `glaze-100` | `#e9f0f0` | subtle fills, hover rows |
| `glaze-200` | `#d5e2e2` | borders, dividers |
| `teal-950` | `#06282b` | shell surfaces, ink on light |
| `teal-900/800/700` | `#0a3a3f / #10494f / #175d64` | sidebar hovers, buttons |
| `teal-600/500` | `#1f747d / #2b8d97` | interactive accents, links |
| `teal-100/50` | `#d3e8ea / #ecf5f6` | selected fills, info tints |
| `gold-600…100` | `#a97e2f…#f3e8cf` | primary emphasis, ornament, focus |
| `terra-600/100` | `#a4552f / #f2ddd2` | destructive, errors |

Rules: gold on teal-950 or as border/ornament on light (never gold text on white
below 18px). Body text = `teal-950` on `glaze-50` (≥13:1). Muted text floor:
`teal-800` (≥7:1).

## Typography

- **UI (product surfaces)**: system sans stack, fixed rem scale, ratio 1.2 —
  12.8 / 14 / 16 / 19.2 / 23 / 27.6. Semibold for emphasis, never display fonts
  in labels, buttons or data.
- **Display (brand surfaces only)**: Marcellus (self-hosted fallback: serif) for
  landing hero, section titles, auth card titles. `text-wrap: balance` on h1–h3.

## Components (`theme.css` utilities)

- `card-tile` — white surface, 1px `glaze-200` border, `--radius-tile` (6px).
- `card-tile-accent` — adds a 2px gold **top** keyline (brand moments only).
- `btn-primary` (teal), `btn-gold` (primary emphasis), `btn-ghost`, `btn-danger`.
  All: focus-visible ring, disabled at 50%, no size jumps on hover.
- `field-label` / `field-input` / `field-error` — uppercase micro-labels,
  gold focus ring, terracotta errors.
- `badge` + per-status color maps (booking/task/invoice status → tint + ink).
- `bg-arabesque` (teal-950 + gold star pattern), `bg-arabesque-light` (glaze +
  faint teal pattern), `divider-arabesque` (line ◆ line).

## Layout

- Public: max-w-6xl centered; hero = teal-950 arabesque, editorial serif.
- ERP: fixed 240px teal-950 sidebar (arabesque), `glaze-50` canvas, content
  max-w none, density welcome. Tables full-width, sticky header at ≥lg.
- Spacing: Tailwind scale; section rhythm 8/12 on public, 6/8 in ERP.

## Motion

State-conveying only, 150–250ms, `ease-out`. Skeletons for loading (`animate-pulse`
on glaze blocks), no spinners mid-content, no page-load choreography.
`prefers-reduced-motion`: transitions drop to 0ms; patterns and layout unchanged.

## Do not

Side-stripe borders, gradient text, glassmorphism, uppercase tracked eyebrows on
every section, numbered section markers, identical icon-card grids, warm cream
backgrounds, display font in UI chrome.
