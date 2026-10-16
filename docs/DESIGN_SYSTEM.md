# TutorPair — Frontend Flat Design System & Visual Philosophy

> **Audience**: AI Agents (GPT, Gemini, Claude, Cursor, Copilot) and Frontend Developers.  
> **Mandate**: Every frontend component, layout, page, and feature built for TutorPair **MUST** strictly adhere to this design philosophy and design token specification.

---

## 🎨 1. Design Philosophy: Confident Flat Reduction

**Flat Design** removes all artifice. It rejects the illusion of three-dimensionality—**no drop shadows, no bevels, no realistic gradients, no textures**. It relies entirely on **hierarchy through size, color, and typography**. This is not minimalism for the sake of being minimal; it's **confident reduction** that creates visual interest through pure form.

The aesthetic is **digital-native but print-inspired**: crisp edges, solid blocks of color, and a strict reliance on the grid. It communicates clarity, efficiency, and modernity. It is not "boring" or "plain"; it is **boldly reductive and graphic**. Every element exists because it is necessary. Visual interest comes from the strategic interplay of solid shapes, vibrant (but controlled) color palettes, and dynamic scale.

### Core Principles:
1. **Zero Artificial Depth**: The Z-axis does not exist. Everything is on the same plane (`box-shadow: none !important`). Visual hierarchy is created through scale, color contrast, and strategic layering of flat shapes.
2. **Color as Structure**: Bold background colors define sections and grouping, not lines or shadows. Color transitions are sharp, never blurred or gradual.
3. **Typography as Interface**: Text size and weight bear the load of hierarchy. Typography is geometric, bold, and demands attention.
4. **Geometric Purity**: Rectangles, circles, and squares dominate. Rounded corners are consistent and moderate (`rounded-md` or `rounded-lg`). No organic blobs or complex shapes.
5. **Interactive Feedback**: Hover states are pronounced through color shifts, scale transformations, and instant transitions—never through shadow depth.
6. **Strategic Decoration**: Large, subtle geometric shapes in the background (`bg-white/5` or `bg-white/8` or `geo-shape`) create visual interest without breaking the flat aesthetic—think poster design.

---

## 📐 2. Design Token System

### Colors (Single Palette: Light Mode)
A vibrant, confident palette that avoids muddy tones. High contrast is essential.

| Token | CSS Variable / Value | Role & Usage |
|---|---|---|
| **Background** | `var(--bg-canvas)` / `#FFFFFF` | Pure White — The primary canvas. |
| **Foreground** | `var(--fg-main)` / `#111827` | Gray 900 — Sharp, high-contrast text. |
| **Primary** | `var(--color-primary)` / `#3B82F6` | Blue 500 — The "Action" color. Bright digital blue. |
| **Primary Hover**| `var(--color-primary-hover)` / `#2563EB` | Blue 600 — Darker hover state. |
| **Primary Tint** | `var(--color-primary-tint)` / `#EFF6FF` | Blue 50 — Soft color block for student/action cards. |
| **Secondary** | `var(--color-secondary)` / `#10B981` | Emerald 500 — Supporting accent for tutors & trust badges. |
| **Secondary Tint**| `var(--color-secondary-tint)` / `#ECFDF5` | Emerald 50 — Color block for tutor profiles & trust cards. |
| **Accent** | `var(--color-accent)` / `#F59E0B` | Amber 500 — For highlights, warnings, and special CTAs. |
| **Accent Tint** | `var(--color-accent-tint)` / `#FFFBEB` | Amber 50 — Accent block background. |
| **Muted** | `var(--color-muted)` / `#F3F4F6` | Gray 100 — Secondary backgrounds, input fields, and alternate sections. |
| **Border** | `var(--color-border)` / `#E5E7EB` | Gray 200 — Used sparingly for structural dividers. |
| **Dark** | `var(--color-dark)` / `#111827` | Dark Gray / Black block for admin portal, How-it-works, & Footer. |

### Typography
* **Font Family**: `'Outfit', sans-serif` (Imported via Google Fonts).  
  A geometric sans-serif that mirrors the crisp geometric shapes of the UI.
* **Headings**: Bold (`700`) or Extra Bold (`800`). Tight letter-spacing (`-0.02em`).
* **Body**: Regular (`400`). Readable, standard line-height (`1.5` to `1.6`).
* **Labels / Buttons**: Medium (`500`), SemiBold (`600`), or Bold (`700`). Uppercase often used for badges and category labels (`letter-spacing: 0.05em`).

### Radius & Shapes
* **Radius**: `rounded-md` (`6px`) or `rounded-lg` (`8px`). Consistent throughout.  
  *Never use full pill rounding (`rounded-full`) except on small tags/badges and circular icon wrappers.*
* **Borders**: Generally `0px`. Background color blocks define edges.  
  *Exceptions*:
  - Form inputs on focus: `border: 2px solid var(--color-primary)`.
  - Outline buttons: Bold `border: 4px solid [color]`.
  - FAQ and table dividers: Thick `border: 2px solid var(--color-border)`.

### Shadows & Effects
* **Shadows**: `shadow-none`. **ABSOLUTELY NO BOX SHADOWS ON ANY ELEMENT.**
* **Gradients**: Only subtle directional monochrome gradients for background decoration (e.g., `from-[#F3F4F6] to-transparent`). Never on buttons, cards, or text.
* **Blur**: **Zero blur**. No `backdrop-blur` or glassmorphism.
* **Background Decoration**: Large, subtle geometric shapes with low opacity (`rgba(255, 255, 255, 0.08)`) positioned absolutely for visual interest.

---

## 🧱 3. Component Stylings

### Buttons
* **Primary Button**: Solid Primary color background (`#3B82F6`), white text, `rounded-md`, height `h-14` to `h-16` (`3.5rem` to `4rem`).  
  *Interaction*: `transition: all 0.2s ease`, `hover:scale-105`, `hover:bg-blue-600`. No shadow.
* **Secondary Button**: Solid Muted background (`#F3F4F6`), dark text (`#111827`), `hover:bg-gray-200` with `hover:scale-105`.
* **Outline Button**: `border: 4px solid [color]` (bold, not thin). Text matches border color, transparent background.  
  *Interaction*: Hover fills background with the border color and switches text to white.
* **Outline White Button**: `border: 4px solid #ffffff`, white text on colored section blocks.

### Cards
* **Style**: "Color Block".
* **Appearance**: Solid background color (White on Gray page, or soft tints like `flat-card-tint-blue`, `flat-card-tint-emerald`). **Zero shadow**. No thin gray borders.
* **Padding**: Generous (`1.5rem` or `2rem`). Rounded corners `rounded-lg` (`8px`).
* **Interaction**: `transition: all 0.2s ease`, `hover:scale-[1.02]`. For colored tints, color intensifies on hover (e.g. `bg-blue-50` $\rightarrow$ `bg-blue-100`).

### Inputs & Form Controls
* **Default State**: Gray 100 background (`#F3F4F6`), no border, text `#111827`, `rounded-md`.
* **Focus State**: White background (`#FFFFFF`), solid `2px` border in Primary Blue (`#3B82F6`). **No focus ring glow or blur**.
* **1–5 Sliders**: Bold accent thumb, discrete numeric steps, high-contrast current value pill.

### Section Stylings
* **Alternating Full-Bleed Color Blocks**:
  - Blue (`#3B82F6`): Hero, high-impact conversion sections.
  - Emerald (`#10B981`): Verification, security, and trust.
  - Amber (`#F59E0B`): Call-to-actions, urgent highlights.
  - Dark (`#111827`): How It Works, admin viewports, footer.
  - Muted (`#F3F4F6`): Alternate form layouts, dashboards, lists.
  - White (`#FFFFFF`): Clean reading canvas.
* **Dividers**: No thin, wispy line dividers between sections. Rely on contrasting color blocks and whitespace. FAQ uses bold `border-2`.

---

## 🎯 4. Iconography & Layout

* **Library**: `lucide-react` (stroke width `2px` to `2.5px`).
* **Treatment**: Placed inside a solid colored circle (e.g., `3.5rem × 3.5rem` white circle with colored icon).
* **Animation**: `group-hover:scale-110` with `transition-transform 0.2s ease`.
* **Grid & Layout**: Rigid 12-column base, `container-flat` max width `1280px`, structured spacing in multiples of 4 / 8 / 16px.

---

## ⚡ 5. Golden Rules for AI Agents Building Frontend

When building or editing ANY frontend code in `apps/client`:

1. **NEVER add `box-shadow`, `drop-shadow`, or `shadow-*` utility classes**. If you see a shadow, remove it.
2. **NEVER add `backdrop-blur` or glassmorphic gradients**.
3. **Use Outfit font** for all typography with bold (`700`/`800`) weights on headers and tight letter-spacing.
4. **Use Scale for Feedback**: Hover effects must use scale (`hover:scale-105` on buttons, `hover:scale-[1.02]` on cards) and color shifts.
5. **Color Blocks Define Structure**: Wrap cards and sections in solid color blocks (`--color-muted`, `--color-primary-tint`, `--color-secondary-tint`, etc.).
6. **Inputs have no border until focused**: On focus, apply a crisp `border: 2px solid var(--color-primary)` without glow.
7. **Keep touch targets generous**: Buttons are `h-14` (`3.5rem`) on standard and `h-16` (`4rem`) on large.
