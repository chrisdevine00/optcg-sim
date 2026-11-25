/** OP10-113 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import { hand, pick, play, trash, V } from './helpers.ts';
import { cardsOf, OTHER_LEADER, SN_LEADER, start, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-113';

/** p1 has `p1life` Life cards, p2 `p2life`; Zoro was just played (the turn it entered). */
function played(p1life: number, p2life: number) {
  const g = start(
    { hand: [ID], life: Array.from({ length: p1life }, () => V.c1) },
    { life: Array.from({ length: p2life }, () => V.c2) },
  );
  play(g, ID);
  return g;
}
const canAttack = (g: ReturnType<typeof played>) =>
  g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', ID));

describe('OP10-113 Roronoa Zoro', () => {
  it('has [Rush] with less Life than the opponent: it can attack the turn it is played', () => {
    expect(canAttack(played(2, 3))).toBe(true);
    expect(canAttack(played(0, 1))).toBe(true);
  });

  it('must not have [Rush] with equal or more Life', () => {
    expect(canAttack(played(3, 3))).toBe(false);
    expect(canAttack(played(4, 3))).toBe(false);
  });

  it('[Trigger]: trash 1 card from your hand: with a {Supernovas} Leader, play this card', () => {
    const g = trigGame(ID, { leader: SN_LEADER, hand: [V.c1, V.c2] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('[Trigger]: with a Leader that is not {Supernovas} the hand card is trashed and Zoro is not played', () => {
    const g = trigGame(ID, { leader: OTHER_LEADER, hand: [V.c1, V.c2] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toContain(V.c1);
  });

  it('[Trigger]: declining adds the card to the hand; with an empty hand the cost cannot be paid', () => {
    const g = trigGame(ID, { leader: SN_LEADER, hand: [V.c1] });
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toEqual([V.c1, ID]);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([]);
    const h = trigGame(ID, { leader: SN_LEADER, hand: [] });
    expect(h.legal().some((a) => a.type === 'trigger' && a.activate)).toBe(false);
  });
});
