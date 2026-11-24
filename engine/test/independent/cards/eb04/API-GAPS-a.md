# EB-04 group A independent card tests: API gaps

- **Scenery effects not exercised (unscripted older sets).** Cards from rotated blocks (for example OP01-031 Oden, OP04-019 Doflamingo) have no script, so their abilities are never offered. The tests use them only for their type or name; the Bird Neptunian DON!! lock test therefore uses the scripted Event OP13-038 instead of a Leader effect.
- **Unordered picks hide candidates.** Cost picks of exactly N cards must be made in canonical order (EB04-022 `trash 2`); `payHand` (kit-op17b) takes the first offered wanted card each time.
- **Hidden hand effects.** What the opponent sees (a "reveal", the opponent's own placement prompt, the "use" question) cannot be observed through the public queries; the tests assert only the prompts' owner, candidates and resulting zones.
- **"Used" state of a [Once Per Turn] ability.** Only visible as the ability not being offered again (EB04-001, -012, -014, -021).
- **No query for lock flags.** The "cannot set DON!! active using Character effects" lock of EB04-016 is observed only through a second Character activation changing nothing.
