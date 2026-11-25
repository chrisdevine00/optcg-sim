/** OP10-021 Punk Hazard. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, pick, V } from './helpers.ts';
import { activate, canPick, CAESAR, offeredAb, SMOKER, start } from './helpers-a10g4.ts';

const ID = 'OP10-021';

/** p1 has the Stage on the field, `rested` rested DON!! and 2 active, and the given Leader. */
const board = (
  leader = CAESAR,
  rested = 2,
  stage: string | { card: string; rested: boolean } = ID,
) => start({ leader, stage, characters: [V.c2], costArea: { active: 2, rested } });

describe('OP10-021 Punk Hazard', () => {
  it('[Activate: Main]: rest this Stage: with [Caesar Clown] as Leader, give 1 rested DON!! to your Leader or a Character', () => {
    const g = board();
    activate(g, g.find('p1', 'stage', ID), 'give-don');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(g.card(g.find('p1', 'characters', V.c2)).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1, given: 1 });
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
  });

  it('can give the DON!! to the Leader', () => {
    const g = board();
    activate(g, g.find('p1', 'stage', ID), 'give-don');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('must not give DON!! when the Leader is not [Caesar Clown]: the Stage is still rested (the cost is paid)', () => {
    const g = board(SMOKER);
    activate(g, g.find('p1', 'stage', ID), 'give-don');
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ rested: 2, given: 0 });
  });

  it('only a rested DON!! is given: with none rested nothing happens', () => {
    const g = board(CAESAR, 0);
    activate(g, g.find('p1', 'stage', ID), 'give-don');
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(dec(g)?.kind).not.toBe('choose');
  });

  it('a rested Stage cannot be activated again (the rest cost)', () => {
    const g = board(CAESAR, 2, { card: ID, rested: true });
    expect(offeredAb(g, g.find('p1', 'stage', ID), 'give-don')).toBe(false);
    const h = board();
    expect(offeredAb(h, h.find('p1', 'stage', ID), 'give-don')).toBe(true);
  });
});
