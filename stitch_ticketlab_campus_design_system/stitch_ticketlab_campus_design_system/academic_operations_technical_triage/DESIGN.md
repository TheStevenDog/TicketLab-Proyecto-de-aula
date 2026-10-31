---
name: Academic Operations & Technical Triage
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#444651'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006a63'
  on-secondary: '#ffffff'
  secondary-container: '#99efe5'
  on-secondary-container: '#006f67'
  tertiary: '#002173'
  on-tertiary: '#ffffff'
  tertiary-container: '#0033a6'
  on-tertiary-container: '#92a7ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#9cf2e8'
  secondary-fixed-dim: '#80d5cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#00504a'
  tertiary-fixed: '#dce1ff'
  tertiary-fixed-dim: '#b7c4ff'
  on-tertiary-fixed: '#001551'
  on-tertiary-fixed-variant: '#0039b5'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
  campus-emerald-dark: '#064E3B'
  campus-emerald-medium: '#115E59'
  campus-surface-alt: '#F8FAFC'
  campus-card-bg: '#FFFFFF'
  status-offline-amber: '#B45309'
  status-warning-amber: '#D97706'
  priority-high-red: '#DC2626'
  priority-resolved-green: '#16A34A'
  border-subtle: '#E5E7EB'
  text-primary: '#0F172A'
  text-muted: '#64748B'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Manrope
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-xs:
    fontFamily: Public Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system is engineered for multi-platform academic infrastructure management, bridging native mobile field triage (React Native/Expo) and operational desktop dispatching (Node.js/Web). It balances institutional authority with the swift, high-clarity demands of field diagnostics. 

The aesthetic is clean, academic, and modern SaaS. It communicates technical accountability, system reliability, and institutional structure. The design style relies on structured surfaces, disciplined typographic rhythm, and strict functional color codification. Visual noise is minimized to prioritize critical operational variables: connectivity status (online/offline state synchronization), asset hierarchy (classroom/block/equipment), and urgent priority triage (high, medium, low).

Surfaces feature crisp borders, subtle layered elevations, and intentional tactile boundaries that withstand high-stress triage environments—from dark lecture halls during technical failures to bright outdoor campus transit.

## Colors

The color palette establishes an authoritative hierarchy built on academic trust and immediate functional recognition.

- **Primary (`#1E3A8A`) & Secondary (`#0F766E`)**: Deep academic navy acts as the primary institutional pillar, grounding top-level navigation, structural titles, and institutional authentication. Deep emerald green and forest green (`#064E3B`, `#115E59`) drive triage action mechanisms: primary creation triggers, camera access, hardware confirmation, and positive operational progress.
- **Offline & Synchronization System**: amber (`#B45309` and `#D97706`) is reserved for operational alerts, non-synchronized JWT states, and pending offline queues. Deep navy and muted emerald designate live online synchronization.
- **Triage Matrix**: Priority tags use immutable semantic mapping:
  - High Priority: `#DC2626` (Red)
  - Medium Priority: `#D97706` (Amber)
  - Low / Resolved: `#16A34A` (Green)
- **Surfaces**: Canvas backgrounds utilize a crisp slate-gray blend (`#F3F4F6` and `#F8FAFC`) to minimize glare in lab settings, while cards and interactive controls utilize pure white (`#FFFFFF`) framed by neutral boundaries (`#E5E7EB`).

## Typography

The type scale pairs **Manrope** for authoritative structural headers with **Public Sans** for high-density administrative readability and tabular clarity.

- **Manrope** anchors layout sections, modal titles, and campus analytics metrics. Its modern geometric curves convey digital precision while retaining institutional balance.
- **Public Sans** delivers exceptional legibility across dense device specs, diagnostic descriptions, classroom metadata strings, and technical response threads.
- All status badges, priority chips, and offline indicators strictly utilize `label-md` or `label-xs` with uppercase capitalization and micro-tracking (`letterSpacing: 0.02em - 0.04em`) to ensure instant triage recognition at a glance.

## Layout & Spacing

The layout model adapts between a responsive single-column, bottom-anchored structure on mobile (Expo/Android) and a multi-column dashboard grid on desktop (Web).

- **Mobile Viewport (360px - 600px)**: Uses full-width fluid layouts with strict `1rem` outer canvas padding (`margin`). Internal screen views are partitioned into dedicated gesture-friendly card blocks. Forms and ticket feeds conform to single-axis vertical scrolling.
- **Desktop/Tablet Viewport (> 768px)**: Transitions into an asymmetric 12-column dashboard layout. Left persistent rail (260px fixed) handles administrative role contexts and global module navigation. The main stage arranges diagnostic filters and analytical metric cards along a 4-column sub-grid with `1.5rem` gutters.
- **Component Padding Rhythms**: `space-xs` (4px) and `space-sm` (8px) govern metadata rows, chip insets, and icon-to-label gaps. `space-md` (16px) establishes standard card interior padding, and `space-xl` (32px) separates distinct functional workflows.

## Elevation & Depth

Visual depth is produced using crisp, low-contrast border boundaries paired with subtle ambient drop shadows. This prevents UI elements from blurring together in dense laboratory inventory listings.

- **Level 0 (Flat / Canvas)**: Background canvas (`#F3F4F6` or `#F8FAFC`). No shadow. Borderless.
- **Level 1 (Cards, Form Containers, Ticket Items)**: Pure white background (`#FFFFFF`) with a 1px border (`#E5E7EB`) and a soft, grounded shadow: `0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)`.
- **Level 2 (Interactive Floating Bars, Tab Navigation, Dropdowns)**: Elevated sticky modules like the global synchronization banner and quick-role toolbars: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modals, Camera Capture Sheets, Role Assignment Dialogs)**: Focus-stealing modal viewports overlaying a 40% opacity navy-tinted scrim (`rgba(15, 23, 42, 0.40)`): `0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -4px rgba(15, 23, 42, 0.08)`.

## Shapes

The design system uses a roundedness factor of **2**, establishing a friendly yet controlled technical environment.

- **Standard Buttons, Inputs, and Badges**: Form inputs, action buttons, and individual ticket item cards adopt an 8px (`0.5rem`) radius, providing crisp alignment across high-density lists.
- **Dashboard Containers & Feature Modals**: Larger modular containers, camera preview cards, and analytical summary blocks scale to 16px (`1rem` / `rounded-lg`).
- **Interactive Triage Chips & Status Pills**: Role selectors (`[Estudiante]`, `[Soporte]`), location blocks (`[Bloque 1]`), and connectivity pills utilize pill-style rounding or soft 8px contours to differentiate actionable triage buttons from static form fields.

## Components

### Global Synchronization & Status Bar
- **Online State**: High-contrast dark navy bar (`#1E3A8A`) featuring a green indicator dot (`#16A34A`), "🟢 Conectado (API JWT)" label, and an outline pill button for "Probar Offline".
- **Offline State**: High-visibility amber bar (`#B45309`) displaying "🟠 MODO OFFLINE · En cola: X pendiente(s)" alongside an immediate white action pill: "Reconectar y Sincronizar".

### Interactive Chips & Role Selectors
- **Selection Chips**: Rendered with an 8px border-radius, 1px neutral border, and light slate surface. Selected state flips to solid institutional emerald (`#0F766E`) or primary navy (`#1E3A8A`) with white bold text.
- **Role Identifier Badges**: Prominent high-contrast badges for hierarchical levels (Nivel 1 Estudiante: Light Slate; Nivel 2 Soporte: Soft Emerald; Nivel 3 Líder: Amber `#FEF3C7` with `#92400E` text; Nivel 4 Admin: Deep Navy with gold/white accents).

### Ticket Cards & Metadata Blocks
- **Container Structure**: White card (`#FFFFFF`), 1px `#E5E7EB` border, 16px padding.
- **Header**: Incident title (`Manrope` semi-bold) left-aligned; semantic status and priority badges docked to the right.
- **Metadata Grid**: Multi-attribute layout using inline SVG iconography (Location 📍, Hardware 💻, Reporter 👤, Technician 🛠️).
- **Offline Badge**: Tickets pending upload feature a warm amber warning badge: "⏳ Pendiente de sincronizar (Guardado Offline)".
- **Technical Feedback Bubble**: A distinct recessed container (`#ECFDF5` border `#A7F3D0`) styled as "💬 Respuesta de Soporte Técnico" separating the user's report from resolution details.

### Form Inputs & Camera Capture
- **Inputs**: 8px corner radius, `#FFFFFF` background, 1px border `#E5E7EB`. On focus: 2px ring in primary navy `#1E3A8A`.
- **Media Controls**: Dual split-action trigger buttons: `[📷 Tomar Foto]` using emerald solid `#0F766E` and `[🖼️ Galería]` using emerald subtle border. Captured thumbnails present an inset container with a red circular dismiss icon in the top-right corner.

### Tab Navigation (Mobile Gesture / Swipe)
- Horizontal bar docked under the global sync banner. Active tabs receive a solid emerald accent underline (3px) and high-contrast text color (`#0F766E`), while inactive tabs remain muted slate (`#64748B`).