# OP-09 group A: disagreements between the independent tests and the scripts

None. All 22 cards (OP09-001, 002, 003, 004, 005, 007, 009, 010, 011, 012, 013, 014, 015, 017, 023, 024, 026, 027, 028, 029, 030, 042) pass every test written from the verified card text and the rules, with no `it.fails`.

Readings the tests assume (so the review can see what a pass depends on):

- **OP09-004 Shanks:** the unlabelled "Give all of your opponent's Characters −1000 power." is a permanent effect while he is on the field (both turns, later-played Characters included, ends when he leaves). Tests pin this; a reading as a one-shot or "during this turn" would fail them.
- **OP09-011 Hongo, OP09-005, OP09-024, OP09-026, OP09-027, OP09-015:** a colon-less "If" is an effect condition (decision 2026-11-24). Hongo's "If your Leader has ... type" comes after the cost colon, so with another Leader the activation is offered, Hongo is rested and nothing happens. OP09-027 Sabo's Once Per Turn is spent when the "If" fails (two-attack test with OP10-029 Dracule Mihawk setting Sabo active).
- **OP09-027 Sabo:** declaring an attack rests the attacker before [When Attacking] activates, so Sabo counts himself among the 3 rested Characters (boundary: 2 other rested Characters draw, 1 does not).
- **OP09-009 Benn / OP09-026 Sakazuki:** "trash" is not a K.O. (a Character with "cannot be K.O.'d by effects" is still trashed; no K.O. event); "K.O." is (an opposing [On K.O.] fires; the same protection prevents it). The protection scenery is OP04-083 Sabo (the only scripted card with an effect-K.O. protection among the cards available).
- **OP09-010 Bonk Punch, OP09-030 Trafalgar Law:** an "up to 1" play from the hand with a filter asks its (possibly empty) question even when nothing qualifies and even with an empty hand.
