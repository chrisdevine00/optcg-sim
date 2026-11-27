# OPTCG Sim

A browser-based One Piece Card Game practice simulator that is also a strategy teacher. Play full games against an AI that runs real meta decks with real card art, then learn from a coach and a post-game review. Unofficial fan tool.

**Play it:** https://chrisdevine00.github.io/optcg-sim/ (release 1.0.0; see `CHANGELOG.md`).

## Status

See `docs/STATUS.md` for the current phase, milestone, and what is next.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173/optcg-sim/
npm test             # unit tests (Vitest)
npm run test:e2e     # Playwright, against a production build
npm run build        # static build in app/dist
npm run cards:update # refresh card data from the source
npm run meta:update  # refresh tournament data, flag stale guides
```

## Design principles

1. **The board reads at a glance.** Whose turn, what phase, how much DON!! each side has, and every card's current power are readable without reading anything. Numbers that change are always live and always where the eye expects them.
2. **Legal moves are visible; illegal ones are not offered.** Attackable targets, playable cards, and attachable DON!! are highlighted. The player is never allowed to attempt something the engine will reject.
3. **Irreversible steps are confirmable, and most steps are rewindable.** Attacks, counters, and effect choices get a clear confirm; rewind steps back through the event log in practice modes.
4. **No hidden state and no surprise.** Pending effects, waiting triggers, and the opponent's visible resources are always on screen. Opponent actions are animated at a followable pace, with a speed control.
5. **Teach by doing, explain on demand.** Every zone, keyword, and prompt has a one-tap explanation. The coach never interrupts unless asked.
6. **Real card art is the hero.** Chrome is quiet, dark, and low-contrast around high-contrast art.
7. **Landscape first, keyboard complete.** Designed at 1280×720 and 1920×1080, adapted to tablet landscape. Phone portrait gets a "rotate to play" screen.

## Layout

- `engine/` pure TypeScript rules engine, no DOM
- `cards/` card data as static JSON plus effect scripts
- `ai/` opponent and analysis, runs in a Web Worker
- `app/` React UI
- `docs/` research, plan, design, content, status

Dependency arrows point downward only: `app → ai → engine → cards`. ESLint enforces the boundaries.

## Accessibility

Tested against WCAG 2.2 AA with automated checks on every route; manual screen-reader passes pending. The known limits (text over card art, the text-spacing override on the board button, NVDA and VoiceOver on the newest screens) are listed in the About page and the CHANGELOG.

## Privacy

There is no account, no server of ours, no analytics and no cookies we set. Games, decks, reviews and progress live in the browser's IndexedDB and localStorage and leave it only when you use Export. After the app has loaded, the only network requests are for card images, from the art hosts named in the About page, and for the app's own files and version check, from GitHub Pages where it is hosted; their operators see your address as any website would. The page sends no referrer. An image address names the card, so the image host can tell which cards you look at. The service worker keeps the app and the images you have seen so it works offline. Settings, then Data, deletes everything. The privacy end-to-end test (`app/e2e/m10-privacy.spec.ts`) records every request origin and fails on one outside the app's own and the art hosts.

## Reporting a problem

Open an issue at https://github.com/chrisdevine00/optcg-sim/issues and include the version details from the About page. A page that fails shows a "Copy details" button that gathers them (release, build, route, the error's name and the first 120 characters of its message with card numbers removed); it never includes saved games or decks, but read it before posting. If the issue tracker is ever switched off, replace this section with the owner's address.

## Credits and licences

The About page and `docs/legal/CREDITS.md` credit every data source, and `third-party.txt` (built by `npm run build`, linked from the About page) holds the licence of every package the app ships.

Licence: to be chosen by the owner.

## Legal

OPTCG Sim is an unofficial, non-commercial fan tool, not affiliated with or endorsed by Bandai, Shueisha, or Toei Animation. One Piece and all card names, text, and art belong to their respective owners.

Unofficial, non-commercial fan tool. Not affiliated with or endorsed by Bandai, Shueisha, or Toei Animation. One Piece and all card names, text, and art are trademarks and copyrights of their respective owners. Card images are displayed from their source at runtime and are not redistributed from this repository.
