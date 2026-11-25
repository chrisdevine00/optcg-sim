/** OP11-081 Cognac Mama-Mash. */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, expectDecision, V } from './helpers.ts';
import {
  atMain,
  BM_LEADER,
  lowerCost,
  nameCost,
  offeredPicks,
  revealGame,
  triggerGame,
} from './helpers-w5c2.ts';

const ID = 'OP11-081';
/** {Navy} vanilla, base cost 8; a cost-9 Character (unscripted [Yamato]). */
const C8 = 'OP05-044';
const C9 = 'OP04-112';
const mk = (top: string = V.c3, p2chars: string[] = [C8, C9]) =>
  revealGame(
    { leader: BM_LEADER, hand: [ID], costArea: { active: 6, rested: 0 } },
    { characters: p2chars },
    top,
  );
const play = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

describe('OP11-081 Cognac Mama-Mash', () => {
  it('[Main]: on a match, K.O. up to 1 Character with a base cost of 8 or less (8 is the boundary, 9 is not)', () => {
    const g = mk(V.c3);
    play(g);
    nameCost(g, 3);
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', C8)]);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', C8) });
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C9]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([C8]);
    expect(g.zone('p2', 'deck')[0]!.card).toBe(V.c3);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('"up to 1": at most one Character is K.O.\'d even when two are eligible', () => {
    const g = mk(V.c3, [C8, V.c4]);
    play(g);
    nameCost(g, 3);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', C8) });
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it("on a miss nothing is K.O.'d and nothing more is asked", () => {
    const g = mk(V.c3);
    play(g);
    nameCost(g, 8);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('reads the base cost: +1 cost on the cost-8 Character does not protect it, -1 on the cost-9 one does not expose it', () => {
    const g = mk(V.c3);
    lowerCost(g, 'p2', C8, 1);
    lowerCost(g, 'p2', C9, -1);
    expect(g.card(g.find('p2', 'characters', C8)).cost).toBe(9);
    expect(g.card(g.find('p2', 'characters', C9)).cost).toBe(8);
    play(g);
    nameCost(g, 3);
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', C8)]);
  });

  it('"up to 1": may K.O. nothing; with no Character of cost 8 or less nothing is asked', () => {
    const g = mk(V.c3);
    play(g);
    nameCost(g, 3);
    g.act({ type: 'done' });
    expect(g.zone('p2', 'characters')).toHaveLength(2);

    const h = mk(V.c3, [C9]);
    play(h);
    nameCost(h, 3);
    expect(dec(h)?.kind).not.toBe('choose');
    expect(h.zone('p2', 'characters')).toHaveLength(1);
  });

  it('[Trigger]: add up to 1 DON!! card and set it as active', () => {
    const g = triggerGame(ID);
    const before = don(g, 'p1');
    g.act({ type: 'trigger', activate: true });
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: before.active + 1, rested: before.rested });
    expectDecision(g, 'main', 'p2');
  });
});
