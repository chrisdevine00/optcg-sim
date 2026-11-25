# Wave 5 group B (OP10-033 .. PRB02-018, OP12-081): independent test API gaps

Observations the public API and the scripted-card pool did not let a test make.

| # | Card | Gap |
| --- | --- | --- |
| G1 | OP11-005 Smoker, OP14-003 Bege | Most older K.O. sources (OP05-102 Gedatsu, OP02-099 Sakazuki, EB01-049 T-Bone, ST08-015 Gum-Gum Pistol) are not scripted, so the sources used are scripted ones: OP16-008 Squard (not Special), OP09-026 Sakazuki (Special), ST35-001 Hack (4000), OP16-006 Shanks (5000), OP17-060 Ulti & Page One (6000), ST21-010 Nico Robin (4000 base, 6000 with DON!!), OP12-096 Ursa Shock (Event). |
| G2 | OP14-003 Bege | "base power 5000 or less" where the current power is below the base (a 6000-base source weakened to 5000 or less) needs a -power effect that a test can aim at the opponent's own Character during their turn; none was found among the scripted cards. Only "base 4000 with +2000 DON!!" is tested. |
| G3 | OP11-005 Smoker | A K.O. by an opposing Leader effect (a Leader is not a Character) was not tested: no scripted Leader K.O. effect reaches a cost 4 Character. |
| G4 | OP12-081 Koala | "plays a Character with a base cost of 8 or more" where the current cost differs (a cost reduction in the opponent's hand) needs a hand cost-reduction source; none was used. |
| G5 | OP11-092 Helmeppo | "other than [Helmeppo]" is tested with EB04-047 (another Helmeppo). The played Character leaving the field before the end of the turn (so nothing is placed at the bottom) was not tested: no cheap source of removal for p1's own Character on p1's turn was found. |
