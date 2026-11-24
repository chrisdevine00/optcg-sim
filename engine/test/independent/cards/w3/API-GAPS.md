# Wave 3 independent tests: observation gaps

None blocking. Notes:

- A Life card taken by damage is observable only after the `trigger` decision is answered (`passCounter` / `takeDamage` do it); a test that ends the Counter Step with a bare `endCounter` and then reads `g.life` sees the old value. The wave-3 tests use `passCounter` wherever Life matters.
- The picks of unordered DON!! classes (`{ from: 'costActive' }` before `{ from: 'costRested' }`) are accepted only in canonical order, and a single-class pool is decided by the engine without a prompt. Tests that return several DON!! (OP16-074) pick active first and tolerate a missing prompt.
