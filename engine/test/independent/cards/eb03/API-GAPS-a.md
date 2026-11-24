# EB-03 group A independent card tests: API gaps

- **`CardView` has no types or attributes.** A test cannot read a card's {type} or <attribute> from the
  public view, so type and attribute filters (Otama's {Animal}/{SMILE}, Camie's {Fish-Man}/{Merfolk},
  Kuina's <Slash>) are tested through which cards the engine offers or accepts, never by reading the
  type back.
- **Empty "up to" picks are sometimes skipped, sometimes asked.** When a target set is empty because of
  public board facts (no rested Character with cost 5 or less for Carrot, no opposing Character with
  4000 base power or less for Alvida, no Character with cost 4 or less for Isuka) the engine skips the
  pick; over the hand (Sugar, Vivi) it asks it at max 0. The tests accept both where the board alone
  decides (`if (kind(g) === 'choose') ...`) and require the prompt where a hand card decides.
- **Pick order hides candidates.** Instance ids are random strings and unordered multi-picks must be
  made in canonical order, so for "pick 2" the first `choose` shows only some candidates. Alvida's two
  targets are two separate prompts, so this did not bite here.
- **"Top or bottom" prompts have no named encoding** (Kaya): end states are enumerated with `outcomes`.
- **DON!! costs resolved by the engine.** With a single DON!! class (all active) a "rest 4 DON!!" cost
  is paid without a pick (EB03-029), so the cost pick cannot be asserted; only its effect on the DON!!
  counts can.
