# ResolveIT — Responsive Design Guide

This guide explains how ResolveIT Simple Edition delivers a seamless, accessible, and fully responsive experience across all screen sizes—from small smartphones to large desktop monitors.

---

## 1. Supported Viewports & Breakpoints

### Test Viewports
ResolveIT is automatically verified against 8 canonical screen viewports:

| Device Category | Viewport (w × h) | Characteristics |
|---|---|---|
| **Small phone** | 320 × 568 | Smallest supported mobile screen; also proves 400% zoom reflow |
| **Common phone** | 360 × 740 | Standard Android mobile dimensions |
| **Common phone** | 390 × 844 | Standard iPhone dimensions (iPhone 12/13/14/15) |
| **Phone landscape** | 844 × 390 | Short height, wide viewport |
| **Tablet portrait** | 768 × 1024 | Standard iPad / tablet portrait mode |
| **Tablet landscape** | 1024 × 768 | iPad / compact laptop resolution |
| **Laptop** | 1280 × 800 | 13-inch laptop desktop baseline |
| **Desktop** | 1440 × 900 | High-resolution desktop display |

### The 4 Responsive Breakpoints
To avoid arbitrary media query fragmentation, ResolveIT adheres strictly to four standardized CSS breakpoints:

```css
/* Responsive Breakpoints: max-width: 1024px, 768px, 640px, 480px */
```

- **`max-width: 1024px` (Tablet Landscape / Small Laptop):**
  - Summary metrics grid transitions from 6 columns to 3 columns.
  - Tables maintain classic table styling within an intentional horizontal scrolling wrapper (`overflow-x: auto`).
  - Two-column details layouts collapse into single vertical stacks.

- **`max-width: 768px` (Tablet Portrait & Large Phones):**
  - Navigation links collapse into an accessible mobile hamburger toggle button (`.nav-toggle-btn`).
  - Touch targets for interactive elements (buttons, inputs, select boxes, textarea, navbar/footer links) expand to a minimum height of **44px** (icon buttons 44×44px).
  - Form input font size is enforced at **16px** minimum to prevent iOS automatic zoom on focus.
  - Summary metrics grid transitions to 2 columns.

- **`max-width: 640px` (Standard Phones):**
  - Dashboard filters bar collapses to a single column (search full width, dropdown selects full width).
  - Data tables (`ComplaintTable` and `AdminUsersPage`) transform from multi-column tables into **stacked mobile cards** via `display: block` and `data-label` pseudo-elements.
  - Action buttons within table cards expand to full width for effortless thumb interaction.

- **`max-width: 480px` (Compact Phones):**
  - Container padding decreases to preserve horizontal breathing room without side-to-side scrolling.
  - Pagination controls hide numbered page buttons and display a concise "Page X of Y" label between Previous and Next controls.
  - Primary form submission buttons expand to full width.
  - Live notification toast popups adjust to 100% width minus margins and center at top.

---

## 2. Core Responsive Rules (R1 – R10)

ResolveIT satisfies all 10 responsive layout rules automatically:

1. **R1 — No Horizontal Page Scroll:**  
   `document.documentElement.scrollWidth <= window.innerWidth + 1`. The root document never has unwanted horizontal scrollbars.

2. **R2 — No Element Protrusion:**  
   Every visible DOM element stays strictly within the viewport width, unless explicitly contained inside an intentional scrolling container (such as table overflow wrappers).

3. **R3 — Touch Targets ≥ 44px:**  
   On screens $\le$ 768px, all interactive targets (buttons, inputs, dropdowns, navigation links, and icon triggers) have a minimum touch height of 44px (or 44×44px for icon buttons). Standard links within running paragraph text are exempt.

4. **R4 — Readable Typography:**  
   Input, select, and textarea elements have `font-size: 16px` on mobile viewports ($\le$ 768px) to prevent mobile browsers from triggering zoom. Table text and paragraph text are kept at $\ge$ 14px.

5. **R5 — Overflow Wrapping on Long Text:**  
   Unbroken 100-character strings, complex emails, and long user names wrap smoothly inside their containers using `overflow-wrap: anywhere; word-break: break-word;`.

6. **R6 — User-Accessible Zoom:**  
   The viewport meta tag in `index.html` is configured as `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` with no restrictive `user-scalable=no` or `maximum-scale` parameters.

7. **R7 — Usable Mobile Tables:**  
   Tables render as card stacks at 390px with clear `data-label` attribute headers, and render as standard tables at 1024px.

8. **R8 — Safe Overlays & Dialogs:**  
   Live notification popups (toasts) and modals fit comfortably within 320px screens and landscape mode (844×390) with easily reachable dismiss controls.

9. **R9 — No Clipping or Element Overlap:**  
   Fixed headers do not obscure content underneath. Password visibility toggle buttons reserve 48px padding so the eye icon never covers typed text.

10. **R10 — Full Keyboard & Screen Reader Accessibility:**  
    Mobile hamburger menus are fully operable with keyboard navigation (`Enter` and `Space` to toggle, `Escape` to close) and maintain synchronized `aria-expanded` attributes.

---

## 3. Page-by-Page Responsive Enhancements

- **Public Home Page (`/` when logged out):**
  - Sticky visitor header with 44×44px mobile hamburger button.
  - Hero headline uses CSS `clamp(1.75rem, 5vw, 2.5rem)` to avoid awkward line breaks on 320px screens.
  - Feature highlights and role cards adapt from 3 columns $\to$ 2 columns $\to$ 1 column.
  - 5-column footer adapts to 2 columns on tablet, 1 column on phone.

- **Authentication Pages (`/login`, `/register`):**
  - Centered cards with fluid margins.
  - Password visibility toggle buttons sized at 44×44px with dedicated internal padding preventing text collisions.
  - Full-width call-to-action buttons on mobile.

- **Complaint Dashboard (`/` when logged in):**
  - Summary cards grid: 6 columns (desktop) $\to$ 3 columns (tablet) $\to$ 2 columns (phone).
  - Search and filter dropdowns expand to full width on mobile viewports.
  - Responsive pagination hiding complex numbers on narrow screens in favor of "Page X of Y".

- **Complaint Table:**
  - On screens $\le$ 640px, table headers hide and each row turns into an independent card.
  - Cells display their field name via `td::before { content: attr(data-label); }`.
  - View button stretches across the entire bottom of each card.

- **Complaint Details (`/complaints/:id`):**
  - Header title and action buttons wrap cleanly.
  - Ticket metadata summary grid flexes to 1 column on mobile.
  - Admin assignment and status transition forms stack vertically with full-width controls.
  - Comment thread and audit history timeline preserve clear vertical flow and timestamp readability.

- **Admin Users Page (`/admin/users`):**
  - Staff table adopts the card format on mobile, preserving role change dropdowns and activation toggles inside each card.

- **Live Notification Alerts (Toasts):**
  - Positioned centrally with `top: env(safe-area-inset-top, 0.5rem)`.
  - Max width constrained with internal scrollbars for lengthy messages.
  - OK and dismiss buttons enlarged to meet 44px minimum target sizes.

---

## 4. How the Automatic Responsive Test Works

Automated testing is implemented in `frontend/e2e/responsive.spec.js` using Playwright:

1. **Test Matrix:**  
   Tests each of the 8 canonical viewports across 9 essential views (Home, Login, Register, Dashboard, Details, Create Form, Profile, Admin Users, 404).
2. **Layout Inspector Helper (`checkLayout(page)`):**  
   Evaluates page geometry inside the browser runtime:
   - Measures `document.documentElement.scrollWidth` against `window.innerWidth`.
   - Inspects `getBoundingClientRect()` of all visible elements for right-edge protrusion.
   - Evaluates computed styles for touch target heights ($\ge$ 44px) and input font sizes ($\ge$ 16px).
   - Validates that overlays and fixed position items stay within screen bounds.
3. **Dedicated Behavioral Tests:**  
   - Dedicated R7 test compares computed display modes and verifies `data-label` attributes on table cells.
   - Dedicated R10 test simulates real keyboard events (`Enter`, `Space`, `Escape`) against mobile hamburger navigation.
4. **Visual Artifacts:**  
   Captures full-page screenshots to `frontend/test-results/responsive/` and tracked verification images:
   - `docs/screenshots/dashboard-mobile.png` (390×844)
   - `docs/screenshots/details-mobile.png` (390×844)

---

## 5. How to Make a New Page Responsive

When creating new pages in ResolveIT, follow these simple principles:

1. **Use Relative Units & Containers:**  
   Wrap content in `<div className="container">` and `<div className="card">`. Use `%`, `rem`, `clamp()`, and flexbox/grid rather than fixed pixel widths.
2. **Attach Data Labels to Tables:**  
   Whenever adding a `<table>`, wrap it in `<div className="table-responsive">` and add `data-label="Column Name"` to every `<td>`.
3. **Form Elements:**  
   Use standard classes (`.form-group`, `.form-input`, `.form-select`, `.form-textarea`, `.btn`). They automatically inherit the 44px touch height and 16px font-size rules on mobile.
4. **Avoid Hardcoded Widths:**  
   Never apply inline styles like `style={{ width: '600px' }}` without a `max-width: 100%`.
5. **Verify With the Pipeline:**  
   Run `node scripts/run-all-tests.mjs --only=responsive` to immediately detect any layout or touch-target violations.

---

## 6. Known Trade-Offs

- **Mobile Table Stacking:** Transforming tables into cards at $\le$ 640px creates longer vertical scrolling on mobile when browsing many records. This is mitigated by default page sizing (10 per page) and responsive pagination controls.
- **Header Collapsing:** The logged-in navigation bar collapses links and user actions into a hamburger menu at $\le$ 768px. Users on tablets in portrait mode access profile and logout via the menu toggle.
