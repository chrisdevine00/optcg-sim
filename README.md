# OPTCG Sim

A browser-based One Piece Card Game practice simulator that is also a strategy teacher. Play full games against an AI that runs real meta decks with real card art, then learn from a coach and a post-game review. Unofficial fan tool.

## Status

See `docs/STATUS.md`. If it says "Not started", nothing has been built yet.

## Start Claude Code on this repo

```bash
git init && git add -A && git commit -m "chore: seed repo with PROMPT.md"
# create an empty repo on GitHub, then:
git remote add origin git@github.com:<you>/optcg-sim.git
git push -u origin main
claude
```

First message to Claude Code:

```
Read PROMPT.md and execute it end to end.
```

To resume later:

```
Read PROMPT.md and docs/STATUS.md, then continue.
```

## Layout once built

- `engine/` pure TypeScript rules engine, no DOM
- `cards/` card data as static JSON plus effect scripts
- `ai/` opponent and analysis, runs in a Web Worker
- `app/` React UI
- `docs/` research, plan, design, content, status

## Legal

Unofficial, non-commercial fan tool. Not affiliated with or endorsed by Bandai, Shueisha, or Toei Animation. One Piece and all card names, text, and art are trademarks and copyrights of their respective owners. Card images are displayed from their source at runtime and are not redistributed from this repository.
