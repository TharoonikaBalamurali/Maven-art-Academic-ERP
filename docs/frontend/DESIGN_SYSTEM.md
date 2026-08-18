# Maven Art Academic ERP — Design System

The visual and interaction contract for the whole ERP. Every module inherits
from here; no screen invents its own colours, spacing or states.

Source of truth: **`src/styles/index.css`** (tokens) and **`src/shared/`**
(components). If a value is not in this document, it should not be typed into a
component.

---

## 1. Design principles

1. **The data is the interface.** Chrome identifies the system and then gets
   out of the way. No decorative panels, no hero sections, no illustration.
2. **Colour carries meaning, never decoration.** A tone always means the same
   thing product-wide; anything communicated by colour is also communicated in
   text.
3. **Density with air.** Administrators work in this for hours. Rows are tight
   enough to compare, spaced enough to scan.
4. **One way to do each thing.** A table, an empty state and a page header look
   the same in Admissions as in Finance.
5. **Quiet by default, loud when it matters.** Only errors, overdue states and
   destructive actions are allowed to be visually strong.
6. **Accessible because of the components, not in spite of them.** A developer
   should have to work hard to build something inaccessible.

---

## 2. Colour

Semantic tokens only. Each is declared **once** with CSS `light-dark()`, so
light and dark cannot drift apart.

| Token | Role |
| --- | --- |
| `--surface` | Page background |
| `--surface-raised` | Cards, header, sidebar — the "paper" |
| `--surface-sunken` | Table headers, inset areas, search field |
| `--surface-hover` | Transient hover feedback |
| `--surface-selected` | Persistent selection (selected table rows) |
| `--border` / `--border-strong` | Default rule / hover + emphasis rule |
| `--text` | Primary content |
| `--text-muted` | Supporting copy, table meta |
| `--text-subtle` | Quietest labels, placeholders |
| `--text-disabled` | Disabled controls (the only token exempt from contrast) |
| `--accent` / `--accent-hover` / `--accent-contrast` / `--accent-surface` | Primary action and its tint |
| `--focus` | Focus ring, independent of accent |
| `--danger`, `--success`, `--warning`, `--info` (+ `-surface`) | Status |

**Status meaning — fixed product-wide:**

| Tone | Meaning |
| --- | --- |
| `success` | Completed, paid, approved |
| `warning` | Pending, needs attention, unread |
| `danger` | Failed, overdue, rejected, destructive |
| `info` | In progress, under review |
| `neutral` | Inert, archived, not applicable |
| `accent` | Informational emphasis |

**Rules**
- Never write a raw colour in a component. Use `text-[var(--token)]` etc.
- Never use colour as the only signal — pair it with text or an icon.
- The brand ramp (`--color-brand-*`) is referenced by semantic tokens only.

---

## 3. Typography

Roles, not sizes. Changing "how big is a table cell" is one edit.

| Utility | Size | Use |
| --- | --- | --- |
| `text-caption` | 11px | Table headers, nav section labels, meta |
| `text-body-sm` | 13px | Dense table content, helper text |
| `text-body` | 14px | Default UI text — the workhorse |
| `text-title` | 16px | Card and section titles |
| `text-page` | 20px | The page `h1` |
| `text-metric` | 24px | Dashboard figures |

Weights: **400** body, **500** emphasis/nav, **600** headings. Nothing heavier.
Numeric columns use `tabular-nums` so digits align.

> **Do not** combine a size token with a colour class outside `cn()` and assume
> both survive — `cn()` is configured to keep them (see §21).

---

## 4. Spacing

Tailwind's 4px scale, applied at fixed levels:

| Level | Value | Use |
| --- | --- | --- |
| `gap-1.5` / `gap-2` | 6–8px | Inside a control, chip groups |
| `gap-3` / `p-3` | 12px | Table cells, filter bars, compact cards |
| `p-4` / `gap-4` | 16px | Card bodies, dashboard grid gaps |
| `mb-5` | 20px | Page header to content |
| `mb-6` | 24px | Between content sections |
| `page-gutter` | 16 → 24 → 32px | Page horizontal padding, responsive |

Max content width: `--container-content` (90rem).

---

## 5–7. Borders, radius, elevation

**Radius by purpose** — never pick a radius by eye:

| Token | Value | Use |
| --- | --- | --- |
| `rounded-control` | 6px | Buttons, inputs, badges, nav rows |
| `rounded-surface` | 8px | Cards, panels |
| `rounded-overlay` | 12px | Modals, drawers, popovers |

Tables have **square inner corners** — a grid, not a card.

**Elevation by level** — one shadow each, deliberately shallow:

| Token | Use |
| --- | --- |
| `shadow-raised` | Cards (via `surface-card`) |
| `shadow-overlay` | Dropdowns, toasts, tooltips |
| `shadow-modal` | Modals only |

Borders do the structural work; shadow only signals "floats above". Never both
a heavy border and a heavy shadow.

**Composite utilities:** `surface-card`, `surface-overlay`, `page-gutter`.

---

## 8. Buttons

Variants: `primary` (one affirmative action per screen), `secondary`,
`ghost` (toolbar/icon), `danger` (always confirmed), `link`.

Sizes: `sm` (36px — inside dense tables only), `md` (44px, default),
`lg` (48px), `icon` (44×44).

Every button supports default / hover / focus-visible / disabled / **loading**
(spinner, `aria-busy`, plus screen-reader text). Icon-only buttons **must**
carry `aria-label`.

---

## 9. Forms

Composition: `FormSection` → field primitives → `FormActions`.

- `Input`, `Select`, `DatePicker` handle label, required marker, description,
  error and ARIA wiring. Never hand-roll a `<label>`.
- Required is marked with `*` **and** the words "(required)" for screen readers.
- Errors use `role="alert"` and are linked by `aria-describedby`.
- `useApiForm` maps backend 422 `fieldErrors` onto the matching inputs, and
  puts everything else in a single `FormError` banner.
- Client validation is shape/presence only — the backend is authoritative (§30).
- `FormActions` is sticky at the bottom; primary sits last on wide screens and
  first when stacked on mobile.

---

## 10. Tables

`DataTable` is presentational: it renders rows and reports sort/selection
intent. It never fetches, filters or paginates — those are server-driven
(§31–§32).

Supports: column alignment and fixed widths, `hideBelowMd` for secondary
columns, sortable headers with `aria-sort`, row selection with an indeterminate
"select all", per-row actions, `compact`/`comfortable` density, and a
`renderMobileCard` fallback.

Pair with: `TableSkeleton` (loading), `EmptyState` (no data),
`NoResultsState` (filtered to nothing), `Pagination` (backend metadata).

Row states: hover `--surface-hover`, selected `--surface-selected` — different
states, different colours.

---

## 11. Cards

`Card` + `CardHeader` / `CardBody` / `CardFooter`.

Use a card to **group** related information. Do not wrap every block in one —
prefer `ContentSection` with a rule for in-page structure, and never nest a
card inside a card.

---

## 12. Navigation

- Config-driven (`config/navigation/*.nav.ts`) and permission-filtered. One
  config serves all roles; there is no per-role navigation file.
- Active state is signalled three ways: colour, weight and a left rule — so it
  survives without colour perception.
- Density: `compact` (40px) in the desktop sidebar, `comfortable` (44px) in the
  mobile drawer.
- Breadcrumbs derive from the same nav config, so they can never disagree.
- Header is `Logo · Search · Notification · Profile` in both portals (§9).

---

## 13. Dialogs

`Modal`, `Drawer` and `ConfirmDialog` are built on the native `<dialog>`
element — focus trap, top layer, inert background and Escape come from the
platform rather than a reimplementation.

Always give a title (becomes the accessible name). Destructive actions go
through `ConfirmDialog` with `destructive`. Both actions disable while loading.

---

## 14. Notifications (toasts)

`toast.success/error/info(title, description?)`. Rendered in a polite live
region so messages are announced without stealing focus; auto-dismiss after 6s;
always dismissible. Toasts are for transient confirmation — never for errors the
user must act on (use `FormError` or an error state).

---

## 15–17. Loading, empty and error states

| State | Component | Rule |
| --- | --- | --- |
| Loading | `TableSkeleton`, `LoadingState`, `LoadingWidget` | Prefer a skeleton matching the content's shape |
| Empty | `EmptyState` | Say what is empty and what to do next |
| No results | `NoResultsState` | Distinct from empty; always offers "clear filters" |
| Error | `ErrorState`, `ErrorWidget` | Human message + retry. Never a raw backend error |
| Forbidden | `ForbiddenState` | States plainly that permission is missing |
| Not found | `NotFoundState` | States the resource does not exist |

`QueryBoundary` maps a query result to the right state automatically from the
normalized `ApiError.kind`. Pages decide only empty vs. no-results, because
only the page knows whether zero rows means "no data" or "your filter matched
nothing".

---

## 18. Responsive rules

Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.

| | Management | Student / Parent |
| --- | --- | --- |
| Desktop | Primary | Supported |
| Tablet | Supported | Supported |
| Mobile | Basic | **First-class** |

- Sidebar is persistent from `lg`; a drawer below that.
- Tables scroll horizontally in Management; Student/Parent tables provide
  `renderMobileCard`.
- Student/Parent gains a bottom tab bar under `sm`.
- No page may scroll horizontally at any width.

---

## 19. Accessibility rules

- Semantic HTML first; ARIA only to fill a genuine gap.
- Every interactive control has an accessible name; icon-only needs `aria-label`.
- Visible focus everywhere via one `:focus-visible` rule using `--focus`.
- Touch targets ≥44px, except deliberately dense desktop-only surfaces
  (sidebar rows, `sm` table buttons).
- Text contrast ≥4.5:1 (≥3:1 for large). **Verified: minimum 5.25:1 light,
  5.39:1 dark.**
- One `h1` per page (`PageHeader`); headings never skip levels.
- Landmarks are uniquely named — two navigations may not both be "Main".
- `prefers-reduced-motion` disables animation.

---

## 20. Dark mode

Dark is a **designed palette, not an inversion**:

- Light: near-white page, pure white cards — paper on a desk.
- Dark: dark-grey page with a *lighter* card, so elevation still reads as
  "closer to the viewer".
- The accent lightens in dark to hold contrast; status tints are re-mixed, not
  merely darkened.

Themes are `light` / `dark` / `system`, stored in `ui.store` and applied as
`data-theme` on the root.

**Theme changes must never animate.** `ThemeEffect` adds a `theme-switching`
class, forces a reflow, changes the theme, forces another reflow, then releases
on the next frame. Without this, `transition-colors` pins `background-color` to
the previous theme's value and cards stay the wrong colour permanently. Do not
"simplify" that sequence.

---

## 21. Component usage guidelines

**Page skeleton**

```tsx
<PageHeader title="Students" description="…" meta={<Badge>…</Badge>}
            actions={<PermissionGuard permission="students.create">…</PermissionGuard>} />
<Card className="overflow-hidden">
  <FilterBar activeCount={n} onClear={clear}>…</FilterBar>
  <QueryBoundary {...query} loadingFallback={<TableSkeleton />}>
    <DataTable … />
    <Pagination … />
  </QueryBoundary>
</Card>
```

**Rules**
- Never write a raw hex, `rgb()` or arbitrary `text-[13px]` in a component.
- Never combine two components that do the same job (one table, one modal).
- `cn()` is **required** for conditional classes — it is configured to keep
  custom size/radius/shadow tokens when a colour class is also present. Using
  template strings instead reintroduces the bug it was written to fix
  (`src/lib/utils/cn.test.ts` locks the behaviour).
- Icons: `lucide-react` only, `size-4` in text, `size-5` in chrome,
  `aria-hidden="true"` when adjacent text already names the control.
- Motion: 150ms colour transitions and the sidebar width transition. Nothing
  else animates.

**Where things live**

| Need | Import from |
| --- | --- |
| Primitives, states, table, toast | `@/shared/ui` |
| Page/section/filter/action layout | `@/shared/layout/page` |
| Shell, breadcrumbs, search | `@/shared/layout` |
| Dashboard widgets | `@/shared/dashboard` |
| Form layout + `useApiForm` | `@/shared/forms` |
