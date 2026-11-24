# Disagreements: EB-03 independent tests, group B

Cards: EB03-035, 036, 037, 038, 041, 042, 043, 044, 045, 046, 047, 048, 049, 050, 052, 056, 058, 059, 060, 061, 062.

None. Every test passes against the current engine and scripts; no `it.fails` was needed.

Readings the tests assume, so the review can check them:

1. **EB03-042 Koala:** "up to 1 {Revolutionary Army} ... other than [Koala] or up to 1 [Nico Robin] ..." plays one card in total (test "plays only one card even when both ... qualify"). The exclusion is by name, so another card named Koala (EB05-041) is never offered.
2. **EB03-038 Thanks for the Treat:** with no Characters at all, "you only have Characters with a type including GERMA" is not asserted (the M6b-Q21 / E-Q4 family leaves the reading open for this wording).
3. **EB03-058 Lilith:** whether [Trigger] may be activated when the "If your Leader is [Vegapunk]" is unmet is not asserted; the test only requires that Lilith is not played.
4. **EB03-052 Shirahoshi:** a "Then" after a failed "If your Leader is [Shirahoshi]" does not resolve (M4b-5), so with another Leader the Character is trashed (cost) and nothing else happens.
5. **EB03-047 / EB03-046:** trashing the last cards of the deck ends the game for the owner at once (rules-digest, CR 9-2-1-2), so the 3-card-deck test for Valentine and the 1-card-deck test for Doublefinger expect a loss.
6. **EB03-049 / EB03-062 / EB03-042 / EB03-043 / EB03-044 / EB03-048 / EB03-059 / EB03-045:** an "up to" pick over the hand (or hand and trash) is asked with no candidate and `done` available, as the brief's convention says. The engine does this everywhere tested.
