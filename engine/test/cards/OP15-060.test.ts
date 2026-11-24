/** OP15-060 Enel. */
import { describe, expect, it } from 'vitest';
import { don, game, hand, payDon, pick, PLAIN_BLUE, V } from './helpers.ts';
import { canActivate, DRESSROSA_LEADER, idsOf, mine, plant } from './helpers-op15g2.ts';

const ID = 'OP15-060';

describe('OP15-060 Enel', () => {
  const withDon = (n: number, handCards: string[] = []) =>
    mine(DRESSROSA_LEADER, { characters: [ID], hand: handCards }, {}, n);
  const enel = (g: ReturnType<typeof mine>) => g.find('p1', 'characters', ID);

  it('with 6 DON!! on your field it gains +2000 power (8000 to 10000)', () => {
    const g = withDon(6);
    expect(g.power(enel(g))).toBe(10000);
  });

  it('with 7 DON!! the condition fails: printed 8000 power', () => {
    const g = withDon(7);
    expect(g.power(enel(g))).toBe(8000);
  });

  it('rested DON!! count toward the 6 (4 active + 3 rested is 7, 4 + 2 is 6)', () => {
    const g = mine(DRESSROSA_LEADER, { characters: [ID] }, {}, 4, 3);
    expect(g.power(enel(g))).toBe(8000);
    const h = mine(DRESSROSA_LEADER, { characters: [ID] }, {}, 4, 2);
    expect(h.power(enel(h))).toBe(10000);
  });

  const koEffect = (n: number) => {
    const g = game(
      { leader: DRESSROSA_LEADER, characters: [ID], costArea: { active: n, rested: 0 } },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plant(g, 'p2', { ko: { from: 'characters', owner: 'opponent', filter: { name: 'Enel' } } });
    return g;
  };

  it("with 6 or less DON!! it cannot be removed from the field by your opponent's effects", () => {
    const g = koEffect(6);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
  });

  it('with 7 DON!! the same effect K.O.s it', () => {
    const g = koEffect(7);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it("[Activate: Main] DON!! -1: gains [Blocker] until the end of your opponent's next End Phase, then trash 1 card from hand", () => {
    const g = withDon(7, [V.c1, V.c2]);
    g.act({ type: 'activate', card: enel(g), ability: 'blocker' });
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 4 });
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c2]);
    expect(g.card(enel(g)).keywords).toContain('Blocker');
    g.act({ type: 'endTurn' });
    expect(g.card(enel(g)).keywords).toContain('Blocker');
    g.act({ type: 'endTurn' });
    expect(g.card(enel(g)).keywords).not.toContain('Blocker');
  });

  it('with an empty hand the Blocker is still gained and nothing is trashed', () => {
    const g = withDon(7);
    g.act({ type: 'activate', card: enel(g), ability: 'blocker' });
    payDon(g);
    expect(g.card(enel(g)).keywords).toContain('Blocker');
  });

  it('cannot be activated with no DON!! to return', () => {
    const g = withDon(0, [V.c1]);
    expect(canActivate(g, enel(g), 'blocker')).toBe(false);
  });
});
