# OPTCG Sim

A browser-based One Piece Card Game practice simulator that is also a strategy teacher. Play full games against an AI that runs real meta decks with real card art, then learn from a coach and a post-game review. Unofficial fan tool.

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

## Legal

Unofficial, non-commercial fan tool. Not affiliated with or endorsed by Bandai, Shueisha, or Toei Animation. One Piece and all card names, text, and art are trademarks and copyrights of their respective owners. Card images are displayed from their source at runtime and are not redistributed from this repository.
