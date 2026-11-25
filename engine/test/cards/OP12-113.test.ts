/** OP12-113 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { dec, game, hand, none, PLAIN_BLUE, pick, trash, V } from './helpers.ts';
import {
  atMain,
  ids,
  offeredPicks,
  OTHER_LEADER,
  SN3,
  SN4,
  SN5,
  SUPERNOVAS_LEADER,
  trigGame,
} from './helpers-w6c2.ts';
import { koBy } from './helpers-w3s.ts';

const ID = 'OP12-113';
const mk = (p1: Partial<PlayerSpec> = {}) =>
  game(
    { leader: SUPERNOVAS_LEADER, characters: [ID], hand: [SN4, SN3, SN5, V.c3], ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c1] },
  );
const ko = (g: ReturnType<typeof mk>) => koBy(g, 'p1', ID, 'p2');

describe('OP12-113 Roronoa Zoro', () => {
  it('[On K.O.]: with a {Supernovas} Leader, plays up to 1 {Supernovas} Character of cost 4 or less from the hand, rested', () => {
    const g = mk();
    ko(g);
    // Cost 4 and 3 {Supernovas}; not the cost 5 one, nor a Character of another type.
    expect(offeredPicks(g).sort()).toEqual(
      [g.find('p1', 'hand', SN4), g.find('p1', 'hand', SN3)].sort(),
    );
    pick(g, [g.find('p1', 'hand', SN4)]);
    expect(ids(g, 'p1', 'characters')).toEqual([SN4]);
    expect(g.card(g.find('p1', 'characters', SN4)).rested).toBe(true);
    expect(hand(g, 'p1')).toEqual([SN3, SN5, V.c3]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('a Leader without the type does nothing: nothing is asked and the hand is untouched', () => {
    const g = mk({ leader: OTHER_LEADER });
    ko(g);
    expect(atMain(g)).toBe(true);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([SN4, SN3, SN5, V.c3]);
  });

  it('exact cost boundary and the hidden hand: with only a cost 5 {Supernovas} the pick is still asked, at max 0', () => {
    const g = mk({ hand: [SN5, V.c3] });
    ko(g);
    // The hand is hidden: the question is the same whether or not a card qualifies.
    expect(dec(g)?.kind).toBe('choose');
    expect(offeredPicks(g)).toEqual([]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([SN5, V.c3]);
  });

  it('"up to 1": only one Character is played even with two eligible, and it may be declined', () => {
    const g = mk();
    ko(g);
    pick(g, [g.find('p1', 'hand', SN3)]);
    expect(ids(g, 'p1', 'characters')).toEqual([SN3]);
    expect(hand(g, 'p1')).toContain(SN4);

    const declined = mk();
    ko(declined);
    none(declined);
    expect(ids(declined, 'p1', 'characters')).toEqual([]);
    expect(hand(declined, 'p1')).toContain(SN4);
  });

  it("does not fire when a Character is K.O.'d that is not this one, nor while it is only on the field", () => {
    const g = mk({ characters: [ID, V.c2] });
    koBy(g, 'p1', V.c2, 'p2');
    expect(atMain(g)).toBe(true);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('[Trigger]: K.O. up to 1 Character with cost 1 or less and add this card to the hand', () => {
    const g = trigGame(ID, {}, { characters: [V.c1, V.c2] });
    g.act({ type: 'trigger', activate: true });
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', V.c1)]);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c7, V.c2]);
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([]);

    // With no target it still goes to the hand.
    const none1 = trigGame(ID, {}, { characters: [V.c2] });
    none1.act({ type: 'trigger', activate: true });
    if (dec(none1)?.kind === 'choose') none1.act({ type: 'done' });
    expect(hand(none1, 'p1')).toEqual([ID]);
  });
});
