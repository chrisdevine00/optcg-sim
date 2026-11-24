/**
 * OP14-083 Ms. Wednesday (Character, Black, cost 1, 1000, Counter +2000, {Baroque Works}).
 *
 * Card text: "[Activate: Main] You may trash this Character: Give up to 1 of your opponent's 0 cost
 * Characters −3000 power during this turn."
 *
 * Rules: [Activate: Main] (CR 10-2-6) can be used the turn the Character is played (no rest cost), the
 * trash is a cost paid first (CR 8-3-1), "0 cost" reads the CURRENT cost (a cost effect can bring a
 * Character to 0; a cost below 0 counts as 0, CR 1-3-6-2), power has no floor and a Character at 0
 * or less power is not removed, "during this turn" ends in the End Phase (RL-09).
 *
 * Opposing Characters have no printed cost of 0, so OP17-097 ("Give all of your opponent's Characters
 * −1 cost during this turn", Event, cost 1) is played first to bring cost-1 Characters to 0.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  backToMain,
  chars,
  chr,
  endTurn,
  kind,
  LD14,
  mayChooseNone,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  playRaw,
  SC14,
  theirs,
  trash,
} from './kit-op14c.ts';

const ID = 'OP14-083';
const RAGE = 'OP17-097';

type G = ReturnType<typeof mine>;

/** My Main Phase: Wednesday on the field, their Characters `p2chars`, RAGE played first when asked. */
function start(p2chars: string[], rage = true): G {
  const g = mine(
    LD14.bw,
    { characters: [ID], hand: rage ? [RAGE] : [], costArea: { active: 4, rested: 0 } },
    { characters: p2chars },
  );
  if (rage) {
    playRaw(g, RAGE);
    backToMain(g, 'p1');
  }
  return g;
}

/** Activate Wednesday; stops at the first prompt after the cost (the target choice). */
function use(g: G): void {
  const [ability] = offeredAbilities(g, at(g, 'p1', 'characters', ID));
  if (!ability) throw new Error('Wednesday has no ability offered');
  act(g, { type: 'activate', card: at(g, 'p1', 'characters', ID), ability });
}

describe('OP14-083 Ms. Wednesday [Activate: Main] trash this: −3000 power to a 0 cost Character', () => {
  it('trashing itself is the cost; the 0-cost Character then gets −3000 power during this turn', () => {
    const g = start([SC14.c1]);
    expect(g.card(chr(g, 'p2', SC14.c1)).cost ?? 0).toBeLessThanOrEqual(0);
    use(g);
    expect(trash(g)).toContain(ID);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SC14.c1)]);
    expect(g.power(chr(g, 'p2', SC14.c1))).toBe(0);
    expect(chars(g, 'p2')).toEqual([SC14.c1]);
  });

  it('only 0-cost Characters are offered: cost 1 (a Character the Event left at 1) is not', () => {
    // Sai costs 2: after −1 it costs 1, Komachiyo costs 1: after −1 it costs 0.
    const g = start([SC14.c1, SC14.c2]);
    use(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c1]);
  });

  it('without the cost reduction nothing has 0 cost: no Character can be chosen', () => {
    const g = start([SC14.c1, SC14.c2], false);
    const offered = offeredAbilities(g, at(g, 'p1', 'characters', ID));
    if (offered.length) {
      use(g);
      if (kind(g) === 'choose') {
        expect(offeredIds(g)).toEqual([]);
        none(g);
      }
    }
    expect(g.power(chr(g, 'p2', SC14.c1))).toBe(3000);
    expect(g.power(chr(g, 'p2', SC14.c2))).toBe(4000);
  });

  it('"up to 1": the target may be skipped; the Character stays trashed', () => {
    const g = start([SC14.c1]);
    use(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(trash(g)).toContain(ID);
    expect(g.power(chr(g, 'p2', SC14.c1))).toBe(3000);
  });

  it('only one Character gets the −3000 when two have 0 cost', () => {
    const g = start([SC14.c1, SC14.zero1]);
    use(g);
    pickInst(g, [chr(g, 'p2', SC14.c1)]);
    expect(g.power(chr(g, 'p2', SC14.c1))).toBe(0);
    expect(g.power(chr(g, 'p2', SC14.zero1))).toBe(0);
  });

  it('power has no floor and a Character at 0 or less power stays on the field: a 0-power one goes to −3000', () => {
    const g = start([SC14.zero1]);
    use(g);
    pickInst(g, [chr(g, 'p2', SC14.zero1)]);
    expect(g.power(chr(g, 'p2', SC14.zero1))).toBe(-3000);
    expect(chars(g, 'p2')).toEqual([SC14.zero1]);
  });

  it('the −3000 lasts this turn only', () => {
    const g = start([SC14.c1]);
    use(g);
    pickInst(g, [chr(g, 'p2', SC14.c1)]);
    expect(g.power(chr(g, 'p2', SC14.c1))).toBe(0);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p2', SC14.c1))).toBe(3000);
  });

  it('a cost below 0 counts as 0 (CR 1-3-6-2): two −1 cost effects make a cost-1 Character a valid 0-cost target', () => {
    const g = mine(
      LD14.bw,
      { characters: [ID], hand: [RAGE, RAGE], costArea: { active: 4, rested: 0 } },
      { characters: [SC14.c1, SC14.c2] },
    );
    playRaw(g, RAGE);
    backToMain(g, 'p1');
    playRaw(g, RAGE);
    backToMain(g, 'p1');
    // Komachiyo: 1 - 2 = -1 (treated as 0); Sai: 2 - 2 = 0.
    use(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c1, SC14.c2].sort());
  });

  it('it can be used the turn it is played (no summoning sickness for [Activate: Main])', () => {
    const g = mine(
      LD14.bw,
      { hand: [ID, RAGE], costArea: { active: 4, rested: 0 } },
      { characters: [SC14.c1] },
    );
    playRaw(g, RAGE);
    playRaw(g, ID);
    backToMain(g, 'p1');
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toHaveLength(1);
  });

  it('it is a Main Phase ability of mine: not offered during the opponent’s turn', () => {
    const g = theirs(LD14.bw, { characters: [ID] }, { characters: [SC14.c1] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });
});
