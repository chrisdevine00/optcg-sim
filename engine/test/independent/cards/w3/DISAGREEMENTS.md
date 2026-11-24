# Wave 3 independent tests: disagreements with the scripts

None. All 14 cards (OP15-002, OP15-003, OP15-010, OP15-012, OP15-017, OP15-023, OP15-026, OP15-028, OP15-059, OP16-024, OP16-041, OP16-074, OP16-100, ST32-003) pass every test; there is no `it.fails`.

## Open questions the tests deliberately stay clear of

- M6b-Q24 (whose DON!! is given by the OP15 DON!!-giving cards): every position keeps the acting player's own DON!! all active, so only the opponent's rested DON!! can be a candidate under any reading.
- M6b-Q25 (OP15-023 [On K.O.]: do rested DON!! count as "cards"): every opposing DON!! is active in those tests.
- M6b-Q44 (OP15-023 / OP15-028: who picks active or rested): the tests answer whichever class the engine asks and assert only the totals (one DON!! leaves the cost area, one is given).
- M6b-Q30 / Q41 (ST32-003: does a rest caused by the Character's own attack or by a cost count as "becomes rested"): every rest in the tests is caused by an opponent's effect. Nothing asserts what an attack does.
- M6b-Q45 (OP15-059 with no active DON!!; OP16-074 with fewer DON!! than asked): asserted only that the -2000 branch stays reachable, and that every DON!! the opponent had is returned.
- M6b-Q22, Q42, Q43 (OP16-100 replaced K.O.; OP16-041 ordering and the Character-limit trash): no test depends on them.
