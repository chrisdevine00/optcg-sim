# OP-12 group B API gaps

- Scenery: OP02-117, P-076's Activate and OP12-041 are not scripted, so they cannot be played or activated in tests. Hina ST06-008 was used for "-N cost" and Gum-Gum Lightning / Jet Culverin for removal.
- Activate [Main] costs and [Trigger] costs show no `optional` prompt: choosing to activate is the opt-in, so a "may" cost cannot be declined once started. Tests decline by not activating.
- Unordered multi-picks list only canonical first picks, so "offered ids" for a pick-2 cost cannot show every candidate.
