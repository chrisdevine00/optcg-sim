/**
 * ST30-014 Mr.3(Galdino) (Character, Green, cost 2, 3000, Counter +2000, {Impel Down}/{Former Baroque Works}).
 *
 * Card text: "[Activate: Main] You may rest this Character: Give up to 2 of your Characters with 6000
 * base power up to 2 rested DON!! cards each."
 *
 * Rules: resting the Character is the activation cost (CR 8-3-1), a rested Character cannot pay it
 * again, "up to" lets the player take fewer (CR 8-4-4-1; the count of an "up to N DON!!" is asked,
 * E-Q11 / eq11-adddon.md), "6000 base power" is exactly 6000 base (RL-49, CR 4-9-2), DON!! to give
 * come from the rested DON!! in the cost area, each given DON!! adds +1000 on my turn (CR 6-5-5-2).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  choices,
  decision,
  don,
  kind,
  mayChooseNone,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  pw,
  SL,
  useAbility,
} from './kit-stb5a.ts';

const ID = 'ST30-014';
const HAJ = 'OP01-018'; // Red, 6000
const JIL = 'OP03-006'; // Red, 6000
const KING = 'OP02-006'; // Red, 7000
const MARCO = 'OP01-023'; // Red, 5000

type Placed = string | { card: string; rested?: boolean; don?: number };

function start(chars: Placed[], rested = 5, active = 10 - rested) {
  const g = mine(SL.luffy, { characters: [ID, ...chars], costArea: { active, rested } });
  useAbility(g, g.find('p1', 'characters', ID));
  return g;
}
const given = (g: ReturnType<typeof start>, card: string, nth = 0) =>
  g.card(g.find('p1', 'characters', card, nth)).don;

describe('ST30-014 Mr.3(Galdino): [Activate: Main] rest this: give up to 2 rested DON!! each to up to 2 Characters with 6000 base power', () => {
  it('offers exactly the Characters with exactly 6000 base power (not Mr.3, 7000, 5000, or a DON!!-boosted 5000)', () => {
    const g = start([HAJ, JIL, KING, { card: MARCO, don: 1 }], 3, 6);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ, JIL].sort());
  });

  it('resting Mr.3 is the cost: he is rested after activating', () => {
    const g = start([HAJ]);
    pickInst(g, [g.find('p1', 'characters', HAJ)]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('gives 2 rested DON!! to one chosen Character: +2000 power on my turn, taken from the rested DON!!', () => {
    const g = start([HAJ, JIL]);
    pickInst(g, [g.find('p1', 'characters', HAJ)]);
    expect(given(g, HAJ)).toBe(2);
    expect(given(g, JIL)).toBe(0);
    expect(pw(g, 'p1', HAJ)).toBe(8000);
    expect(don(g)).toMatchObject({ active: 5, rested: 3, given: 2 });
  });

  it('two Characters get 2 each (4 rested DON!! used) when enough rested DON!! exist', () => {
    const g = start([HAJ, JIL], 5);
    pickInst(g, [g.find('p1', 'characters', HAJ), g.find('p1', 'characters', JIL)]);
    expect(given(g, HAJ)).toBe(2);
    expect(given(g, JIL)).toBe(2);
    expect(don(g)).toMatchObject({ active: 5, rested: 1, given: 4 });
  });

  it('"up to 2 Characters": three candidates, but no more than two can be chosen', () => {
    const g = start([HAJ, JIL, 'OP02-003'], 6);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ, JIL, 'OP02-003'].sort());
    pickInst(g, [g.find('p1', 'characters', HAJ), g.find('p1', 'characters', JIL)]);
    expect(given(g, 'OP02-003')).toBe(0);
    expect(kind(g)).toBe('main');
  });

  it('"up to": may choose no Character; nothing is given but Mr.3 stays rested (the cost was paid)', () => {
    const g = start([HAJ]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(given(g, HAJ)).toBe(0);
    expect(don(g)).toMatchObject({ rested: 5, given: 0 });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('cannot be activated when Mr.3 is already rested (the cost cannot be paid)', () => {
    const g = mine(SL.luffy, {
      characters: [{ card: ID, rested: true }, HAJ],
      costArea: { active: 5, rested: 5 },
    });
    expect(kind(g)).toBe('main');
    expect(offeredAbilities(g, g.find('p1', 'characters', ID))).toEqual([]);
  });

  it('only my own Characters are candidates', () => {
    const g = mine(
      SL.luffy,
      { characters: [ID, HAJ], costArea: { active: 5, rested: 5 } },
      { characters: [JIL] },
    );
    useAbility(g, g.find('p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ]);
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('no rested DON!!: nothing can be given (the active DON!! are untouched)', () => {
    const g = mine(SL.luffy, {
      characters: [ID, HAJ],
      costArea: { active: 10, rested: 0 },
    });
    if (offeredAbilities(g, g.find('p1', 'characters', ID)).length > 0) {
      useAbility(g, g.find('p1', 'characters', ID));
      if (kind(g) === 'choose') {
        const d = decision(g);
        if (choices(g).length > 0) pickInst(g, [g.find('p1', 'characters', HAJ)]);
        else if (d) act(g, { type: 'done' });
      }
    }
    expect(given(g, HAJ)).toBe(0);
    expect(don(g)).toMatchObject({ active: 10, given: 0 });
  });

  // Engine disagreements (see DISAGREEMENTS-a.md): the DON!! count of "up to 2 ... each" is not asked.
  it.fails(
    '"up to 2 rested DON!! each": the count per Character is asked (2, 1 or 0), not fixed at 2',
    () => {
      const g = start([HAJ], 5);
      pickInst(g, [g.find('p1', 'characters', HAJ)]);
      const d = decision(g);
      expect(d?.kind).toBe('choose');
      expect(d?.purpose).toBe('mode');
    },
  );

  it.fails(
    'with 3 rested DON!! and two Characters, both may be chosen (2 to one, 1 to the other)',
    () => {
      const g = start([HAJ, JIL], 3, 7);
      need(g, 'choose', 'p1');
      const d = decision(g);
      expect(d?.max).toBe(2);
    },
  );
});
