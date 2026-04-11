# Design System Document: The Electric Editorial

## 1. Overview & Creative North Star: "The Kinetic Curator"
This design system moves away from the static, boxy nature of traditional event platforms. Our Creative North Star is **"The Kinetic Curator."** We aim to capture the pulse of live events through a high-end editorial lens. 

To break the "template" look, we utilize **intentional asymmetry** and **tonal depth**. Instead of rigid grids, we use overlapping elements—such as a display headline partially bleeding over an image container—to create a sense of forward motion. We reject the "standard" UI by replacing harsh lines with sophisticated layering and expansive breathing room, ensuring the platform feels like a premium concierge rather than a database.

---

## 2. Colors & Surface Architecture
Our palette transitions from deep, authoritative indigos to high-energy teals. We avoid the "flatness" of modern SaaS by utilizing a hierarchy of tonal shifts.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section should sit directly on a `surface` background to define its start and end.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent layers. 
- **Base Layer:** `surface` (#faf4ff)
- **Nested Content:** Use `surface-container-low` (#f5eeff) for secondary sections and `surface-container-lowest` (#ffffff) for the most prominent interactive cards.
- **Glass & Gradient Rule:** For floating headers or mobile navigation bars, use "Glassmorphism." Apply `surface` at 80% opacity with a `backdrop-blur` of 12px. 
- **Signature Textures:** Main CTAs and Hero sections should utilize a subtle linear gradient from `primary` (#4a40e0) to `primary-container` (#9795ff) at a 135-degree angle to provide "visual soul."

---

## 3. Typography: Editorial Authority
We pair **Plus Jakarta Sans** (Display/Headlines) for a custom, high-end feel with **Inter** (Body) for maximum legibility.

*   **The Display Scale:** Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for hero headlines. This conveys the "Electric" energy of the brand.
*   **The Headline Scale:** `headline-sm` (1.5rem) should be used for event titles on cards, ensuring they command attention without overcrowding the container.
*   **Body & Labels:** `body-md` (0.875rem) in `on-surface-variant` (#5f557f) provides a sophisticated, low-contrast feel for descriptions, while `label-md` (0.75rem) in all-caps should be used for "SOLD OUT" or "TRENDING" badges to provide an editorial "tag" look.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to create "pop"; we use them to simulate ambient light.

*   **The Layering Principle:** Depth is achieved by "stacking." Place a `surface-container-lowest` card on a `surface-container-low` background. The shift from #f5eeff to #ffffff creates a natural, soft lift.
*   **Ambient Shadows:** For floating action buttons or high-priority modals, use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(50, 41, 79, 0.06);`. The shadow color is a tinted version of `on-surface` (#32294f), never pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a container definition (e.g., in high-contrast modes), use a "Ghost Border": `outline-variant` (#b2a6d5) at 15% opacity.
*   **Glassmorphism:** Use `surface-variant` at 40% opacity with a heavy blur for background decorative elements, allowing the vibrant indigo energy to bleed through the UI.

---

## 5. Components

### Buttons & CTAs
- **Primary:** Gradient fill (`primary` to `primary-container`) with `on-primary` text. Use `xl` (1.5rem) roundedness.
- **Secondary:** `surface-container-highest` fill with `primary` text. No border.
- **Tertiary:** No fill. `primary` text with an underline that appears only on hover.

### Cards & Lists (The "No-Divider" Layout)
- **Cards:** Use `lg` (1rem) corner radius. Forbid divider lines between the header and body of the card. Use 24px of vertical padding to separate elements.
- **Lists:** Instead of 1px lines, use alternating background tints or 16px of `gap` spacing. The "leading" element (e.g., an event thumbnail) should use `md` (0.75rem) roundedness.

### Input Fields & Chips
- **Inputs:** Use `surface-container-high` as the background fill. Upon focus, transition the background to `surface-container-lowest` and add a 2px `primary` ghost-border (20% opacity).
- **Chips:** Selection chips for categories (e.g., "Music," "Tech") should use `secondary-container` (#89f5e7) with `on-secondary-container` (#005c54) text to provide a vibrant teal pop against the indigo theme.

### Signature Event Components
- **The "Pulse" Indicator:** A small, animated teal dot (`secondary`) next to "Live Now" text to add kinetic energy.
- **Floating Price Tag:** A `surface-container-lowest` pill with a 10% `primary` ghost-border, positioned asymmetrically overlapping the top-right of an event image.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., 24px left, 32px right) for hero sections to create a custom editorial feel.
*   **Do** use `primary-fixed-dim` (#8885ff) for icons to ensure they feel integrated with the typography.
*   **Do** prioritize mobile-first touch targets (minimum 44x44px) using the `full` roundedness scale for small action buttons.

### Don’t:
*   **Don’t** use a 1px solid border to separate the navigation bar from the content; use a `backdrop-blur` or a subtle `surface` color shift instead.
*   **Don’t** use pure black (#000000) for text. Use `on-surface` (#32294f) to maintain the sophisticated, indigo-tinted atmosphere.
*   **Don’t** crowd the layout. If a screen feels "busy," increase the vertical spacing using the `xl` (1.5rem) spacing increment.