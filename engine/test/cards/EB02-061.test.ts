/** EB02-061 Monkey.D.Luffy (Purple Character). */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, dec, decline, don, expectDecision, hand, PURPLE } from './helpers.ts';
import { finishBattle, mk, MULTI_LEADER, OTHER_LEADER, SHC_LEADER, V } from './helpers-aeb2g2.ts';

const ID = 'EB02-061';
const rush = (
  leader: string,
  oppDon: number,
  p2chars: (string | { card: string; don: number })[] = [],
) => {
  const g = mk(
    { leader, characters: [ID] },
    { costArea: { active: oppDon, rested: 0 }, characters: p2chars },
  );
  return g.card(g.find('p1', 'characters', ID)).keywords.includes('Rush');
};
const attack = (p1: Parameters<typeof mk>[0] = {}) => {
  const g = mk({
    leader: MULTI_LEADER,
    characters: [{ card: ID }],
    life: [BLUE, PURPLE, PURPLE],
    costArea: { active: 4, rested: 0 },
    ...p1,
  });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};

describe('EB02-061 Monkey.D.Luffy', () => {
  it("has [Rush] with a multicolored Leader and 5 or more DON!! on the opponent's field (boundary 5)", () => {
    expect(rush(MULTI_LEADER, 5)).toBe(true);
    expect(rush(MULTI_LEADER, 7)).toBe(true);
    expect(rush(MULTI_LEADER, 4)).toBe(false);
  });

  it("the opponent's DON!! given to their cards count as on their field; a Leader that is not multicolored never gives [Rush]", () => {
    expect(rush(MULTI_LEADER, 4, [{ card: V.c1, don: 1 }])).toBe(true);
    expect(rush(SHC_LEADER, 5)).toBe(false);
    expect(rush(OTHER_LEADER, 10)).toBe(false);
  });

  it('[When Attacking] returns 2 active DON!! to the DON!! deck: sets Luffy active, then adds the top Life card to the hand', () => {
    const g = attack();
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    accept(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p1', 'life')).toHaveLength(2);
  });

  it('"You may": declining leaves Luffy rested, the DON!! and the Life as they were', () => {
    const g = attack();
    decline(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 4 });
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'life')).toHaveLength(3);
  });

  it('boundary: 1 active DON!! cannot pay (rested DON!! do not count): the effect is not offered', () => {
    const g = attack({ costArea: { active: 1, rested: 3 } });
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('with no Life cards Luffy is still set active and nothing is added to the hand', () => {
    const g = attack({ life: [] });
    accept(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('Once Per Turn: the re-attack by the now active Luffy offers no second use', () => {
    const g = attack({ costArea: { active: 6, rested: 0 } });
    accept(g);
    finishBattle(g);
    expectDecision(g, 'main', 'p1');
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 4 });
  });
});
