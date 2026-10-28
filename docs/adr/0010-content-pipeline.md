# ADR 0010: Learning content is Markdown with front matter, compiled at build time

**Status:** Accepted, 2026-10-28

## Context
Archetype guides, curriculum, glossary, rules reference and coach explanations must cite sources, carry an as-of date, and never drift from the AI playbooks.

## Decision
Content lives in `docs/content/` as Markdown with front matter (`title`, `sources[]`, `asOf`, `confidence`). A small Vite plugin compiles it into JSON modules for the app, and a build check fails on missing sources or as-of dates, unknown card IDs, or an explorer archetype without a playbook. Playbooks (`ai/playbooks/`) hold the machine-readable game plan; the guide's structured sections (mulligan, key cards, matchups) are generated from or checked against the playbook.

## Alternatives rejected
Content in TypeScript (hard to review as prose); a headless CMS (server).

## Consequences
Writing a guide is a docs change with a CI check, which keeps "never invent" enforceable.
