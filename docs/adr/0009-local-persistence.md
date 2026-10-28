# ADR 0009: Local-only persistence in IndexedDB and localStorage

**Status:** Accepted, 2026-10-28

## Context
Replays, reviews, drill results and progress must persist without accounts or servers (PROMPT.md "Things you must not do").

## Decision
IndexedDB (through a small typed wrapper, no library) stores game records, reviews, drill attempts and progress; `localStorage` stores settings and cosmetic art choices. One "Export data" JSON file contains everything and "Import" restores it, with a schema version.

## Alternatives rejected
`localStorage` only (5 MB limit, synchronous); a sync service (out of scope).

## Consequences
Clearing site data loses progress; Settings explains this and offers export.
