/** OP11-046 Vinsmoke Yonji. */
import { describe, expect, it } from 'vitest';
import { dec, pick, PLAIN_BLUE, V } from './helpers.ts';
import {
  GERMA5,
  koBy,
  mine,
  OTHER_LEADER,
  plant,
  plantOpponentEffect,
  theirs,
} from './helpers-lfa.ts';

const ID = 'OP11-046';
type G = ReturnType<typeof theirs>;
const chars = (g: G) => g.zone('p1', 'characters').map((c) => c.card);
const yonji = (g: G) => g.find('p1', 'characters', ID);

/** p2's turn (p2 over PLAIN_BLUE, so a planted effect can run): p1 has Yonji and `others`. */
const board = (others: string[] = []) =>
  theirs(OTHER_LEADER, { characters: [ID, ...others] }, { leader: PLAIN_BLUE });
/** p2's effect rests one of p1's Characters; answers the pick with `target` if asked. */
const restBy = (g: G, target: string) => {
  plantOpponentEffect(g, { rest: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } });
  if (dec(g)?.kind === 'choose') pick(g, [g.find('p1', 'characters', target)]);
};

describe('OP11-046 Vinsmoke Yonji', () => {
  it("alone, or with only {GERMA 66} Characters, an opponent's effect cannot K.O. him", () => {
    const alone = board();
    koBy(alone, 'p1', ID, 'p2');
    expect(chars(alone)).toEqual([ID]);
    const germa = board([GERMA5]);
    koBy(germa, 'p1', ID, 'p2');
    expect(chars(germa).sort()).toEqual([ID, GERMA5].sort());
  });

  it("and an opponent's effect cannot rest him", () => {
    const g = board([GERMA5]);
    restBy(g, ID);
    expect(g.card(yonji(g)).rested).toBe(false);
  });

  it('must not apply when you have a Character without a type including GERMA: both K.O. and rest work', () => {
    const ko = board([V.c3]);
    koBy(ko, 'p1', ID, 'p2');
    expect(chars(ko)).toEqual([V.c3]);
    const rest = board([V.c3]);
    restBy(rest, ID);
    expect(rest.card(yonji(rest)).rested).toBe(true);
  });

  it('"a type including GERMA" is a substring: {GERMA 66} counts although the type is not exactly GERMA', () => {
    const g = board([GERMA5, GERMA5]);
    koBy(g, 'p1', ID, 'p2');
    expect(chars(g)).toContain(ID);
  });

  it("only YOUR Characters count: the opponent's non-GERMA Characters change nothing", () => {
    const g = theirs(
      OTHER_LEADER,
      { characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    koBy(g, 'p1', ID, 'p2');
    expect(chars(g)).toEqual([ID]);
  });

  it('the condition is live: when the non-GERMA Character leaves he is protected again', () => {
    const g = board([V.c3]);
    koBy(g, 'p1', V.c3, 'p1');
    koBy(g, 'p1', ID, 'p2');
    expect(chars(g)).toEqual([ID]);
  });

  it('your own effects are not stopped: you can K.O. or rest him yourself', () => {
    const own = board();
    koBy(own, 'p1', ID, 'p1');
    expect(chars(own)).toEqual([]);
    const g = mine(OTHER_LEADER, { characters: [ID] });
    plant(g, 'p1', { rest: { from: 'characters', owner: 'you', pick: { exactly: 1 } } });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('has [Blocker]', () => {
    const g = board();
    expect(g.card(yonji(g)).keywords).toContain('Blocker');
  });
});
