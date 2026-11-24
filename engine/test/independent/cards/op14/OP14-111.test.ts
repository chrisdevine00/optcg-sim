/**
 * OP14-111 Perona (Character, Yellow, cost 4, 5000, Counter +1000, {Thriller Bark Pirates}).
 *
 * Card text: "[On Play]/[On K.O.] Up to 1 of your opponent's Characters with a cost of 6 or less cannot
 * attack until the end of your opponent's next End Phase.
 * [Trigger] Play up to 1 {Thriller Bark Pirates} type Character card with a cost of 4 or less from
 * your trash rested."
 *
 * Rules: CR 8-4-4 ("up to"), CR 6-6-1 (duration), CR 10-2-17 ([On K.O.]).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attackers,
  describeTbTrigger,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playId,
  SC14,
  skipEmptyChoose,
  theirs,
  theyKo,
  toMyNextMain,
} from './kit-op14d.ts';

const ID = 'OP14-111';

function played(p2chars: string[] = [SC14.c6, SC14.c7, SC14.c4]) {
  const g = mine(LD14.neutral, { hand: [ID] }, { characters: p2chars });
  playId(g, ID);
  return g;
}

describe('OP14-111 Perona: [On Play] up to 1 opposing Character with cost 6 or less cannot attack', () => {
  it('cost boundary: cost 6 and lower are offered, cost 7 is not', () => {
    const g = played();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c4, SC14.c6].sort());
  });

  it("only the opponent's Characters are offered (not my own, not either Leader)", () => {
    const g = mine(LD14.neutral, { hand: [ID], characters: [SC14.c2] }, { characters: [SC14.c4] });
    playId(g, ID);
    expect(offeredIds(g)).toEqual([SC14.c4]);
  });

  it("the chosen Character cannot attack during the opponent's next turn; the others can", () => {
    const g = played([SC14.c6, SC14.c4]);
    pickCards(g, [SC14.c6]);
    expect(atMain(g)).toBe(true);
    g.act({ type: 'endTurn' });
    expect(atMain(g, 'p2')).toBe(true);
    const locked = g.find('p2', 'characters', SC14.c6);
    const free = g.find('p2', 'characters', SC14.c4);
    expect(attackers(g)).toContain(free);
    expect(attackers(g)).not.toContain(locked);
  });

  it('the restriction ends after that End Phase: the Character can attack again on the following turn', () => {
    const g = played([SC14.c6]);
    pickCards(g, [SC14.c6]);
    toMyNextMain(g);
    g.act({ type: 'endTurn' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(attackers(g)).toContain(g.find('p2', 'characters', SC14.c6));
  });

  it('"up to 1": may choose nobody, and then every Character can attack', () => {
    const g = played([SC14.c6]);
    none(g);
    g.act({ type: 'endTurn' });
    expect(attackers(g)).toContain(g.find('p2', 'characters', SC14.c6));
  });

  it('with no eligible opposing Character nothing is asked', () => {
    const g = played([SC14.c7, SC14.c8]);
    skipEmptyChoose(g);
    expect(atMain(g)).toBe(true);
  });
});

describe('OP14-111 Perona: [On K.O.] the same effect', () => {
  function koed(p2chars: string[]) {
    const g = theirs(
      LD14.neutral,
      { characters: [{ card: ID, rested: true }] },
      { characters: p2chars },
    );
    theyKo(g, at(g, 'p1', 'characters', ID));
    return g;
  }

  it('K.O.d: offers the opposing Characters with cost 6 or less only', () => {
    const g = koed([SC14.c4, SC14.c6, SC14.c7]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c4, SC14.c6].sort());
  });

  it('the chosen Character cannot attack for the rest of that turn', () => {
    const g = koed([SC14.c4, SC14.c6]);
    pickCards(g, [SC14.c6]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(attackers(g)).not.toContain(g.find('p2', 'characters', SC14.c6));
    expect(attackers(g)).toContain(g.find('p2', 'characters', SC14.c4));
  });
});

describeTbTrigger(ID);
