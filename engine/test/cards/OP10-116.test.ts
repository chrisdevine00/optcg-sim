/** OP10-116 Damned Punk. */
import { describe, expect, it } from 'vitest';
import { dec, game, hand, none, option, pick, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { atMain, ids, optionIds, pickableCardIds, triggerGame } from './helpers-w7c1.ts';

const ID = 'OP10-116';

describe('OP10-116 Damned Punk', () => {
  const mk = (p1: object = {}, p2: object = {}) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: [ID],
        costArea: { active: 4, rested: 0 },
        life: [V.c3, V.c1, V.c2],
        ...p1,
      },
      { leader: PLAIN_BLUE, characters: [V.c5, V.c6, V.c4], life: [V.c6, V.c4, V.c5], ...p2 },
    );
  const cast = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

  it('[Main]: look at the top of your Life and move it to the bottom, then K.O. an opponent Character of cost 5 or less', () => {
    const g = mk();
    cast(g);
    expect(optionIds(g)).toEqual(['you', 'opponent', 'none']);
    option(g, 'you');
    option(g, 'bottom');
    expect(ids(g, 'p1', 'life')).toEqual([V.c1, V.c2, V.c3]);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c6, V.c4]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
    expect(atMain(g)).toBe(true);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it("the opponent's Life may be the one looked at; it stays in their Life", () => {
    const g = mk();
    cast(g);
    option(g, 'opponent');
    option(g, 'top');
    expect(ids(g, 'p2', 'life')).toEqual([V.c6, V.c4, V.c5]);
    expect(ids(g, 'p1', 'life')).toEqual([V.c3, V.c1, V.c2]);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5, V.c6]);
  });

  it('"up to 1": looking at none still K.O.s ("Then" is sequence, not a condition on the look)', () => {
    const g = mk();
    cast(g);
    option(g, 'none');
    expect(ids(g, 'p1', 'life')).toEqual([V.c3, V.c1, V.c2]);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c6, V.c4]);
  });

  it('boundary: a cost of 5 can be K.O.d, a cost of 6 cannot', () => {
    const g = mk();
    cast(g);
    option(g, 'none');
    expect(pickableCardIds(g).sort()).toEqual([V.c4, V.c5].sort());
  });

  it('"up to 1": no K.O. target is allowed', () => {
    const g = mk();
    cast(g);
    option(g, 'none');
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5, V.c6, V.c4]);
  });

  it('with only a cost 6 Character nothing is K.O.d and nothing more is asked', () => {
    const g = mk({}, { characters: [V.c6] });
    cast(g);
    option(g, 'none');
    expect(atMain(g)).toBe(true);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it('[Trigger]: draw 2 cards and trash 1 card from your hand', () => {
    const g = triggerGame(ID, { hand: [V.c7] });
    g.act({ type: 'trigger', activate: true });
    // Hand: V.c7 plus 2 drawn; exactly 1 is trashed, chosen by you.
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(dec(g)?.kind).toBe('choose');
    pick(g, [g.find('p1', 'hand', V.c7)]);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(ids(g, 'p1', 'trash')).toContain(V.c7);
  });

  it('[Trigger] not activated: the card goes to the hand and nothing is drawn', () => {
    const g = triggerGame(ID, { hand: [V.c7] });
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toEqual([V.c7, ID]);
  });
});
