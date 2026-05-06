# Personal Life Tracker - Product Source of Truth

This file is the single source of truth for product, design, and engineering decisions.

If another AI instruction conflicts with this file, follow this file.

## Product Vision

Build a beautiful daily life app that helps the user grow in three pillars:

- Body: physical health, training, nutrition, and recovery.
- Soul: mind, emotions, and will.
- Spirit: spiritual practices, family connection, and practical life stewardship.

The goal is balanced daily faithfulness, not perfection in one pillar.

## Primary User and Job To Be Done

Primary user: a busy parent who wants integrated growth without juggling separate apps.

Core job to be done:
- Plan the day across Body, Soul, and Spirit.
- Complete meaningful practices quickly.
- Reflect and adjust weekly.

## Product Principles

- Balance over intensity: all three pillars matter every day.
- Progress over perfection: streaks and trends are useful, shame is not.
- Fast logging: core actions should take under 10 seconds.
- Calm premium design: simple, warm, focused, and emotionally grounding.
- Family and stewardship are first-class outcomes, not side notes.

## Canonical Pillar Definitions

### Body
- Training sessions and movement.
- Nutrition logging and macro targets.
- Recovery (sleep/readiness trends, if available).

### Soul
- Mind: reading, learning, intentional input.
- Emotions: emotional regulation, gratitude, relational awareness.
- Will: focused action, commitments, discipline.

### Spirit
- Prayer, scripture, worship, reflection.
- Presence with kids and family.
- Practical stewardship tasks (home, planning, responsibilities).

## Core User Loop

1. Start day with a lightweight Daily Rhythm plan.
2. Complete pillar practices throughout the day.
3. Capture quick reflection in the evening.
4. Run weekly review to rebalance goals and commitments.

## Information Architecture

- Overview: today summary across all pillars.
- Body: workout, nutrition, recovery.
- Soul: mind/emotions/will practices.
- Spirit: spiritual practices, family, stewardship.
- Progress: trends, weekly summaries, consistency.
- Settings: profile, integrations, preferences.

## Design Direction (Rivian-Inspired)

Desired tone:
- Modern, premium, grounded, and warm.
- Dark surfaces with restrained amber/sage accents.
- Spacious cards, subtle highlights, minimal visual noise.

Design constraints:
- Accessibility first (contrast, dynamic type behavior, touch targets).
- One primary action per screen section.
- Avoid clutter and excessive iconography.
- Use motion only to reinforce completion and flow.

## Technical Direction (Authoritative)

Swift and SwiftUI are not required for this project.

The product is built as:
- React + TypeScript + Vite
- Tailwind CSS design tokens
- Capacitor for iOS packaging
- Supabase for backend/data/functions

Implementation preference:
- Keep shipping in the existing web stack.
- Consider native SwiftUI only for future experiments if there is a clear business reason.

## Engineering Architecture

- Feature-oriented organization with reusable shared components/hooks.
- Domain-first modeling so data structures remain stable across UI changes.
- Offline-friendly behavior for daily logs and check-ins where possible.
- Explicit error and loading states on all network-dependent screens.

## Domain Model (Canonical)

- Pillar: `body | soul | spirit`
- Practice: repeatable action with category, schedule, and intent
- CheckIn: completion event with timestamp and optional note
- DailyPlan: selected anchors for today across all pillars
- WeeklyReview: summary metrics, wins, misses, and adjustments
- Goal: current goal + goal history per pillar

## Success Metrics

- Daily consistency across all 3 pillars.
- Weekly completion rate of planned anchors.
- Time-to-log for common actions.
- User-perceived clarity and calmness of the app.

## Current Priorities

1. Create a unified Daily Rhythm flow across Body, Soul, and Spirit.
2. Elevate Spirit to include family and practical stewardship as explicit tracked items.
3. Standardize design system primitives for consistency and speed.
4. Improve weekly review insights and rebalance suggestions.

## Out of Scope (for now)

- Full native app rewrite.
- Complex gamification mechanics.
- Social features.

## Working Agreement for AI Assistants

When generating code or plans for this repository:

- Do not require Swift or SwiftUI.
- Prefer React + TypeScript patterns already used in the codebase.
- Respect current navigation and pillar model.
- Build complete implementations without TODO placeholders.
- Prioritize readability, accessibility, and maintainable feature boundaries.

