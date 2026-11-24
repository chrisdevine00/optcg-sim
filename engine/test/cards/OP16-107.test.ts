/** OP16-107 Jesus Burgess. */
import { describe, expect, it } from 'vitest';
import { accept, expectDecision, hand, pick, V } from './helpers.ts';
import { koByBattle, names, OTHER_LEADER, trig } from './helpers-op16g4.ts';

const ID = 'OP16-107';

describe('OP16-107 Jesus Burgess', () => {
  it("[On K.O.] adds up to 1 card from the top of your opponent's Life to its owner's hand", () => {
    const g = koByBattle({ leader: OTHER_LEADER }, ID);
    accept(g); // "up to 1": asked, take the card
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p2')).toHaveLength(1);
  });

  it('with no opposing Life cards nothing is added', () => {
    const g = koByBattle({ leader: OTHER_LEADER }, ID, { life: [] });
    expect(g.life('p2')).toBe(0);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('[Trigger] trash 1 card from your hand: play this card', () => {
    const g = trig(ID, { leader: OTHER_LEADER, hand: [V.c1] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(names(g, 'p1', 'trash')).toEqual([V.c1]);
  });

  it('must not be activatable with an empty hand (the cost cannot be paid)', () => {
    const g = trig(ID, { leader: OTHER_LEADER, hand: [] });
    expectDecision(g, 'trigger', 'p1');
    expect(g.isLegal({ type: 'trigger', activate: true, player: 'p1' })).toBe(false);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toEqual([ID]);
  });
});
