---
name: Luminous Tech
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#d0bcff'
  on-tertiary: '#3c0091'
  tertiary-container: '#b395ff'
  on-tertiary-container: '#4900ae'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system is built for high-performance developer tools and technical platforms. It employs a **Modern Glassmorphism** aesthetic set against a deep, immersive background to reduce eye strain during long sessions while maintaining a high-energy, futuristic feel.

The brand personality is precise, innovative, and focused. It evokes a sense of "digital craftsmanship" through the use of translucent layers, vibrant accent glows, and razor-sharp typography. The UI should feel like a high-end physical console—tactile yet ethereal.

## Colors

The palette is anchored by a deep slate blue background to provide maximum contrast for the vibrant accents. 

- **Primary (Electric Cyan):** Used for main actions, active states, and primary navigation indicators. It represents energy and connectivity.
- **Secondary (Emerald/Mint):** Used for success states, secondary highlights, and additive information. 
- **Tertiary (Violet):** Reserved for special features, complex data visualizations, or "AI" integrated elements.
- **Surface Strategy:** Surfaces use semi-transparent variants of the neutral slate, allowing background blurs to create depth.

## Typography

The design system utilizes **Geist** for its systematic, neutral, and highly legible characteristics, perfect for dense technical interfaces. **JetBrains Mono** is used selectively for code snippets, status labels, and metadata to reinforce the developer-centric aesthetic.

Headlines should use tighter letter spacing and heavier weights to stand out against the dark background. Body text maintains generous line height to ensure readability in documentation-heavy views.

## Layout & Spacing

The design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. A strict 4px base unit ensures mathematical consistency across all components.

- **Desktop:** 12 columns / 24px gutter / 32px side margins.
- **Tablet:** 8 columns / 20px gutter / 24px side margins.
- **Mobile:** 4 columns / 16px gutter / 16px side margins.

Use "md" (16px) for standard component spacing and "lg" (24px) for section padding. Containers should use `max-width: 1440px` to maintain optimal line lengths on ultra-wide monitors.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Backdrop Blurs** rather than traditional heavy shadows.

- **Level 0 (Background):** Deep Slate (#0F172A).
- **Level 1 (Cards/Containers):** Surface Slate (#1E293B) at 60% opacity with a `backdrop-filter: blur(12px)`.
- **Level 2 (Popovers/Modals):** Lighter Surface (#334155) at 80% opacity with a `backdrop-filter: blur(20px)`.
- **Overlays:** Use a subtle 1px inner border (stroke) with 10% white opacity to define edges against the dark background, simulating light hitting the rim of a glass surface.

## Shapes

The design system uses a "Soft" corner logic to balance technical precision with modern approachability. 

- **Standard Elements:** 0.25rem (4px) for buttons, inputs, and small widgets.
- **Large Elements:** 0.5rem (8px) for cards, modals, and main content containers.
- **Interactive States:** On hover, certain interactive elements may transition their border-radius slightly for a "squishy" feedback effect, though this is secondary to color transitions.

## Components

### Buttons
- **Primary:** Background in Electric Cyan (#06B6D4), text in deep slate. High-contrast and immediately visible.
- **Secondary:** Transparent background with a 1px Emerald/Mint (#10B981) border and mint text.
- **Ghost:** No background, cyan text, appears with a subtle slate background on hover.

### Status Badges
- **Active/Success:** Emerald/Mint (#10B981) text on a 10% opacity Mint background.
- **Warning/Pending:** Electric Cyan (#06B6D4) text on a 10% opacity Cyan background.
- **Error:** Soft Red (#EF4444) text on 10% red background.

### Input Fields
- Dark backgrounds (10% darker than the surface).
- Focus state: 1px border in Electric Cyan (#06B6D4) with a faint cyan outer glow (4px blur).

### Cards
- Use the Level 1 elevation (glassmorphism). 
- Header areas within cards should be separated by a subtle 1px divider in the neutral slate palette.

### Navigation Highlighting
- Active navigation items use a 2px vertical "pill" indicator on the left side in Electric Cyan (#06B6D4).