# PRODUCT.md

A few notes I keep while building this, so I don't argue with myself.

## What the product is

The ERP is the *primary* thing. A reception desk needs to confirm a
booking, check a guest in, print an invoice, and assign a cleaner — in
that order, quickly, without ambiguity. The design serves the task.

The public site (landing, hotel browsing, auth) is *secondary*. It
carries the visual identity because it's the surface a stranger sees
first, but it's a small part of the product.

## Users

- **Staff** (admin, manager, receptionist) live in data tables all day.
  They want density, keyboard speed, and zero ambiguity. Decoration gets
  in the way.
- **Clients** visit occasionally. They want clarity. They will abandon
  the booking if the date picker confuses them.
- **Recruiters** end up here through the portfolio link. The code and
  the UI both need to look like someone who knows what they're doing
  built them.

## Visual identity

Deep teal ("glazed tile") + gold ("brass inlay") on a teal-tinted
near-white ("glaze"). The arabesque 8-point star is the only ornament;
it lives on shells (sidebar, hero, footer, auth backdrops) and never
behind data. The reason is plain: an arabesque pattern behind a table
of bookings makes the table unreadable, and a table I can't read is
worse than no table.

## What I want the product to feel like

- The ERP feels like a tool. You can tell the moment you open a
  reception desk app that someone designed it for someone who has to
  use it 8 hours a day.
- The public site feels like a hotel — calm, considered, a bit
  editorial. Not a SaaS landing page.

## Copy

UI in Spanish. Code, identifiers and API in English. I'll worry about
translations when the product has to.

## What I won't do

- A warm beige background with gradient text and an uppercase eyebrow
  kicker on every section. The landing-template look.
- A "Bootstrap admin" stat-card grid where every dashboard is the same
  four KPI cards.
- Arabesque clip-art. No camels, no lanterns, no cursive "Arabesian"
  fonts. The pattern is geometric, architectural, and earns its place
  by being low-opacity texture.
