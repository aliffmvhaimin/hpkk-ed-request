# Design Direction

## Design Inspiration URL

No external reference. Custom direction: calm clinical dashboard.

## What We Borrow

- Layout: information-dense scheduling dashboard with a clear monthly hierarchy.
- Spacing: compact enough for roster work, with breathing room around controls and weekly groups.
- Color mood: navy structure, teal primary actions, warm neutral surfaces, and restrained semantic colors.
- Typography feel: calm, professional, legible, and operational rather than promotional.
- Card/button style: subtle elevation or borders, medium corner radius, clear active/hover/focus states.
- Mobile feel: personal agenda first, full shared grid available as a secondary toggle.

## What We Do Not Copy

- No borrowed brand, logo, institutional seal, copy, photographs, or private identity.
- No exact recreation of the spreadsheet's cramped cells.
- No fake metrics, testimonials, staff data, or operational claims.
- No decorative visual treatment that competes with the schedule.

## Visual Mood

Calm, clinical, trustworthy, polished, and efficient.

## Layout Rules

- Desktop opens with a compact header, month navigation, a short legend, and the monthly grid as the primary content.
- The staff-name column and date headers remain sticky during grid scrolling.
- Other staff rows are visibly read-only. The signed-in staff row is highlighted without relying on color alone and contains inline multi-select date controls.
- Each Monday-Sunday week is visually grouped with its required remark field on the signed-in row.
- Save state and validation errors appear close to the affected week; use one clear primary action for saving current changes.
- Admin account management is a separate, simple table/form view and does not add request-edit controls.
- Empty months show the complete calendar structure plus a concise empty-state message, not a blank page.

## Color / Contrast Rules

- Navy is used for navigation, headings, and stable structure.
- Teal is reserved for primary actions, active selections, and focus emphasis.
- Neutral off-white/gray surfaces separate weeks and rows.
- Request codes may use restrained semantic chips, but every chip includes readable text.
- Errors use accessible red with an icon/text message; warnings use amber and never depend on color alone.
- Meet WCAG AA contrast for normal text and interactive controls.

## Typography Feel

Use a highly legible system or open-source sans-serif. Headings are firm and compact; body text and data cells prioritize scanning. Avoid oversized marketing typography and tiny spreadsheet text.

## Component Style

- Buttons: clear labels, solid teal primary button, neutral secondary buttons, destructive styling only for confirmed deletion.
- Cards/panels: subtle border, restrained shadow, medium radius, consistent padding.
- Inputs: persistent labels, visible focus rings, clear selected values, inline validation.
- Request codes: compact labeled chips showing code and Malay meaning where space permits.
- Read-only state: lock/read-only label plus reduced emphasis, not disabled-looking low contrast.
- Delete affordance: available only on owned current/future entries and always requires confirmation.

## Mobile Rules

- Default to the signed-in user's personal agenda, grouped by week.
- Keep month navigation, identity, and unsaved-change state visible near the top.
- Each date expands to a comfortable multi-select control; the weekly remark sits immediately below its dates.
- Provide an explicit toggle to the full all-staff grid, which may scroll horizontally with sticky names/dates.
- Use at least 44px touch targets and never require hover.
- Do not cut off code labels, dates, validation text, or save controls at common phone widths.

## Accessibility Basics

- Keyboard access for month navigation, code selection, save, cancel, and delete.
- Visible focus states and logical focus order.
- Form controls have programmatic labels and errors linked with accessible descriptions.
- Table/grid semantics identify row and column headers.
- Announce save success/failure and validation errors to assistive technology.
- Do not use color alone for ownership, request type, status, or errors.

## Anti-Slop Rules

- No fake logos.
- No fake testimonials.
- No fake stats unless clearly marked sample.
- No lorem ipsum in final proof.
- No random gradient blobs or decorative healthcare stock imagery.
- One clear primary action per editing context.
- Readable on phone width.
- No generic dashboard charts unrelated to the request workflow.
- No invented staff names in production seed/import data; use clearly labeled dummy accounts for proof.

## Design Verification Checklist

- [ ] The first screen feels calm, clinical, and operational.
- [ ] The desktop monthly grid is readable without copying Excel's cramped layout.
- [ ] Ownership and read-only states are clear without color alone.
- [ ] Weekly remarks and validation appear next to the dates they govern.
- [ ] The mobile personal agenda is usable before opening the full grid.
- [ ] Keyboard, focus, contrast, labels, and touch targets meet the stated rules.
- [ ] Nothing clones another brand or invents unsupported claims.
