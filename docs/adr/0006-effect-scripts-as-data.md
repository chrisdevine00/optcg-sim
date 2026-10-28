# ADR 0006: Effect scripts are hand-written, typed data; text is never parsed into behaviour

**Status:** Proposed, 2026-10-28 (vocabulary defined by Track E in `docs/research/effect-dsl.md`)

## Context
Thousands of cards use natural-language effect text with many one-off wordings. Automatic parsing would silently misread cards; hand-written imperative code per card would be untestable at scale and unsearchable by the AI.

## Decision
Each scripted card has a TypeScript file in `cards/effects/` exporting a typed data object built from a fixed vocabulary (timing, conditions, costs, targets, actions). The engine interprets it (ADR 0003). Track E tokenizes card text only to measure which vocabulary to build first. Every script has a test. `cards:update` fails CI when a scripted card's text changes until the script is re-verified. Unscripted cards play for their stats with an "effect not automated" badge and lower the coverage number.

## Alternatives rejected
NLP or regex parsing of text into scripts (silent errors in a product whose value is correctness); per-card imperative functions (cannot be serialized mid-resolution or analysed by the AI).

## Consequences
Coverage grows by hand at a measurable rate; the PLAN risk register tracks velocity.
