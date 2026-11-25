# EB-02 group A independent card tests: API gaps

- **Pick order hides candidates.** Unordered picks must be made in canonical (sorted instance id)
  order, so for "choose 2 of 3" (EB02-024 Sogeking's "place 2 cards") the first `choose` shows only
  some candidates and `choices` is not "the set of eligible cards". The Sogeking tests therefore
  assert the hand contents instead of the offered list. A `Decision.candidates` list would remove
  the workaround.
- **Name aliases are only observable through scripted cards.** "Also treat this card's name as
  [Tony Tony.Chopper]" (EB02-016) is observed through OP15-085 ("other than [Tony Tony.Chopper]").
  "Also treat this card's name as [Usopp]" (EB02-024) has no scripted reader in the repository
  (OP03-042, which would name [Usopp], is unscripted; OP10-057 reads the Leader only), so the alias
  of Sogeking is untested.
- **Unscripted scenery.** OP08-016 Dr.Hiriluk, the natural observer of the Chopperman alias, has no
  script; the tests use OP15-085 instead.
- **"Cannot be rested" targets.** A Character protected by EB02-011 may still be offered as a target
  of a rest effect (nothing happens to it). The API has no way to ask whether a target is "legal but
  inert", so the tests assert the outcome (not rested) and not the offer.
- **Delayed "at the end of this turn" counts.** EB02-015's DON!! half asks its count question during
  my End Phase, after `endTurn`; the helper `endMine` in the test answers it when it is the pending
  decision.
