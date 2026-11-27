# Changelog

All notable changes to OPTCG Sim are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the version is
[SemVer](https://semver.org/). The release number is the app's `package.json` version, which
`version.json` and the About page report. The rules engine's own `ENGINE_VERSION` is separate: it
versions saved game records.

## [Unreleased]

Weekly data refreshes (card data and tournament lists, by their reviewed pull requests) are collected
here and released as patch versions.

## [1.0.0] - date set at release

The first release: M0 to M10.

### Added

- A rules engine for the One Piece Card Game Standard format in English; every card in the current
  tournament lists plays fully.
- Play: against the Rookie, Pirate, Warlord and Emperor AI, or a friend at the same device; a
  keyboard-complete board with a legal-move display, rewind in practice, and a followable
  opponent turn at a speed you choose.
- A tutorial for new players, and 20 short lessons.
- The coach: why a move is good, a lethal check that says what it can and cannot prove, and a
  warning before a clear mistake (off by default).
- Game review: saved games, a timeline of the turning points, and practice from any flagged moment.
- A deck builder with Standard legality, import and export in the common formats, and the 36
  current tournament lists.
- Four drills (mulligan, lethal, counter or take it, DON!! allocation), a rules reference with a
  "show me" board for each rule, a Meta Explorer with matchup grid and deck guides, and a progress
  page.
- The release shell: an About page with credits, the version line, third-party licences and a plain
  privacy statement; an error page that leaves saved data alone; an offline line; a Page not found
  page; an icon, a web manifest, a Content Security Policy; a deploy check that fetches the live
  site and compares its build id.
- Works offline after the first visit (the app and the card images you have seen are kept by a
  service worker); updates are offered, never forced mid-game.
- Built to WCAG 2.2 AA: keyboard-complete, 24 px targets, reduced motion, and no meaning carried
  by colour alone.

### Known limits

- There are four drills.
- 16 cards are playable as stats only (their effect scripts wait on an official-text check or a
  design decision).
- In the lethal drill, the "no lethal" items are limited to the case of too few attackers.
- The Warlord AI wins 61.5 percent of games against the Pirate AI, below the 65 percent target
  (200-game nightly measurement; 55 percent is the guarded floor).
- English cards and the Standard format only.
- The tournament lists are as of the date the About page shows; when they are older than 60 days
  the page says so.
- Card images load from optcgapi.com; they carry its SAMPLE watermark, and when one is missing the
  card is drawn as text.
- The licence of this project's own code is to be chosen by the owner.
