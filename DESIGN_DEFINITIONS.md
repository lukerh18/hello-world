# Design Definitions (Rivian-Esque)

This system is designed to feel premium, calm, warm, and focused.

## Tone

- Matte dark surfaces as the default canvas.
- Warm amber for primary emphasis and focus.
- Muted sage for success/support states.
- Spacious cards with soft elevation and minimal visual noise.

## Core Tokens

### Surface

- `surface.950`: deepest app chrome
- `surface.900`: page background
- `surface.800`: cards and modules
- `surface.700`: controls and nested surfaces
- `surface.600`: dividers and high-contrast borders

### Accent + Status

- `accent.DEFAULT`: primary call to action
- `accent.light`: hover and focused emphasis
- `accent.soft`: low-emphasis amber accents
- `accent.muted`: sage secondary accent
- `success`, `warn`, `danger`: semantic feedback colors

### Typography

- `text.primary`: high-contrast copy
- `text.secondary`: supporting copy
- `text.muted`: tertiary metadata
- Font family: `Inter`, then system sans fallback

### Elevation + Shape

- `shadow.panel`: primary card elevation
- `shadow.insetSoft`: restrained top-edge highlight
- `shadow.focusAmber`: focus ring glow
- `radius.panel`: 18px for premium rounded cards

## Interaction

- One clear primary action per section.
- Motion is restrained and only reinforces completion/flow.
- Focus states are visible and warm (`focus-rivian` utility).
- Maintain accessibility contrast and touch-friendly sizing.
