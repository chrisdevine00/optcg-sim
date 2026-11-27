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
- Tested against WCAG 2.2 AA with automated checks on every route; manual screen-reader passes pending.
  Keyboard-complete, 24 px targets, reduced motion, and no meaning carried by colour alone are
  design rules checked by those tests; the limits of the claim are listed below.

### Known limits

- There are four drills.
- 16 cards are playable as stats only (their effect scripts wait on an official-text check or a
  design decision).
- In the lethal drill, the "no lethal" items are limited to the case of too few attackers.
- The Warlord AI wins 61.5 percent of games against the Pirate AI, below the 65 percent target
  (200-game nightly measurement; 55 percent is the guarded floor).
- The Warlord and Emperor AI make you wait while they think: in the app's real time budgets a
  typical Warlord turn takes about 9 seconds, 2 to 4 seconds of it waiting for the AI (the design
  target is 8 seconds; the measured miss is recorded in `docs/design/board.md` section 5.2).
- Accessibility limits:
  - Text drawn over card art: its contrast is unverified, because the automated audit blocks card art.
  - With text spacing forced larger (WCAG 1.4.12), the main button on two board screens at 1280×720 wraps to three lines and its border is cut by 4 pixels; its label stays whole.
  - NVDA was scripted for the earlier milestones; the About, Page not found, update and offline screens have not been heard. VoiceOver has not been run. Both are pending.
- The frame-rate figure is main-thread frame cadence at 4 times CPU slowdown on a software
  compositor, not a count of frames shown; the compositor's partial and dropped frames are reported
  beside it in `docs/benchmarks.md`.
- English cards and the Standard format only.
- The tournament lists are as of the date the About page shows; when they are older than 60 days
  the page says so.
- Card images load from optcgapi.com; they carry its SAMPLE watermark, and when one is missing the
  card is drawn as text.
- The licence of this project's own code is to be chosen by the owner.
