---
name: MAVIS Terminal
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
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#bec5e5'
  on-tertiary: '#282f49'
  tertiary-container: '#9ba2c1'
  on-tertiary-container: '#313852'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#bec5e5'
  on-tertiary-fixed: '#131a33'
  on-tertiary-fixed-variant: '#3e4660'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-num:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 20px
  margin: 40px
---

## Brand & Style

The design system for this product is a high-precision, technical interface designed for real-time vehicle monitoring and IoT telemetry. The brand personality is authoritative, reliable, and technologically advanced. 

The aesthetic blends **Minimalism** with **Glassmorphism**, prioritizing data density and legibility. It utilizes a "Dark Mode First" approach to reduce eye strain during long monitoring sessions and to allow vibrant status indicators to pop against the deep slate backdrop. Surfaces use subtle transparency and backdrop blurs to maintain a sense of depth and layering without cluttering the visual field.

## Colors

The palette is anchored in a **Deep Slate Blue** (#0F172A) for the primary application canvas, providing a low-light environment that emphasizes critical telemetry data. 

- **Primary Emerald/Mint**: Used for success states, active connections, and primary calls to action.
- **Secondary Cyan**: Used for informational highlights, data visualizations, and secondary interactive elements.
- **Surface Layering**: Use #0B132B for "well" areas or background sections that require visual recession. 
- **Glass Overlays**: For floating panels, use a semi-transparent white (e.g., `rgba(255, 255, 255, 0.03)`) with a 12px backdrop blur to create a high-tech "head-up display" (HUD) feel.

## Typography

Typography is focused on extreme legibility and "at-a-glance" scanning. **Inter** provides a clean, neutral foundation for UI controls and headings. **JetBrains Mono** is introduced for labels and numerical telemetry data to reinforce the technical, IoT nature of the system and ensure that numbers align perfectly in vertical columns (tabular figures).

Use uppercase for labels to create a professional, industrial aesthetic. Large data points should use the `data-num` style to ensure they remain the primary focus of the dashboard.

## Layout & Spacing

The layout follows a **Fixed Grid** model optimized for 1920x1080 resolution. A 12-column grid is used with 20px gutters and 40px outer margins. 

Modules are organized into card-based components. Critical real-time alerts should occupy a persistent sidebar (3 columns) or top-bar (80px height), while the main telemetry workspace expands to fill the remaining 9 columns. All spacing units are derived from a 4px baseline, ensuring perfect alignment of data tables and technical readouts.

## Elevation & Depth

This design system uses **Tonal Layering** and **Glassmorphism** instead of traditional drop shadows to maintain a clean, flat aesthetic.

1.  **Level 0 (Base)**: #0F172A. The main "desk" surface.
2.  **Level 1 (Card/Container)**: #1E293B at 40% opacity with a 1px border (#334155). This is the default state for data modules.
3.  **Level 2 (Active/Floating)**: Semi-transparent overlay with `backdrop-filter: blur(12px)`. Used for modals and dropdowns.
4.  **Borders**: Instead of shadows, use 1px stroke borders in #334155 or #1E293B to define shapes. High-priority cards can use a subtle "glow" border (0.5px primary color at 30% opacity).

## Shapes

The shape language is precise and geometric. A "Soft" roundedness level (0.25rem / 4px) is applied to all buttons, input fields, and small UI components to keep the interface feeling modern yet professional. 

Larger containers and dashboard cards use `rounded-lg` (8px) to create a subtle distinction between the layout structure and the interactive elements within it.

## Components

- **Buttons**: Primary buttons are solid Emerald (#10B981) with black text for high contrast. Secondary buttons use a "Ghost" style with a 1px Cyan border and Cyan text.
- **Telemetry Cards**: Transparent backgrounds with a 1px #334155 border. They must include a `label-sm` header and a `data-num` value center-aligned or left-aligned.
- **Status Indicators**: Small circular pips. Use a "pulse" animation for 'Danger' states to attract immediate attention.
- **Input Fields**: Dark backgrounds (#0B132B) with 1px borders. Focused state should change the border color to Cyan (#06B6D4) with a subtle outer glow.
- **Data Tables**: Use #0B132B for the header row. No vertical lines; use subtle horizontal dividers in #1E293B.
- **Gauges**: Use SVG-based circular or linear progress bars with the Primary/Secondary colors. Avoid skeuomorphism; keep them flat and vector-sharp.