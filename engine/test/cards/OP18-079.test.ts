/** OP18-079 Spandam (Leader). */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, don, hand, pick, trash, V } from './helpers.ts';
import { activate, candidates } from './helpers-a10g1.ts';
import { mine, NERO, SPANDAM_L } from './helpers-op18-g3.ts';

const ID = SPANDAM_L;
const start = (
  o: { hand?: string[]; active?: number; leader?: string | { card: string; rested: boolean } } = {},
) =>
  mine(
    {
      leader: o.leader ?? ID,
      hand: o.hand ?? [NERO, BLUE],
      deck: [V.c3, ...Array<string>(10).fill(BLUE)],
      costArea: { active: o.active ?? 3, rested: 0 },
    },
    {},
  );
const act = (g: ReturnType<typeof start>) => activate(g, g.leader('p1'), 'life');
const canAct = (g: ReturnType<typeof start>) =>
  g.legal().some((a) => a.type === 'activate' && a.card === g.leader('p1'));

describe('OP18-079 Spandam', () => {
  it('rests 2 DON!!, this Leader and a "CP" card from the hand: the top card of the deck goes on top of Life', () => {
    const g = start();
    act(g);
    expect(candidates(g)).toEqual([g.find('p1', 'hand', NERO)]);
    pick(g, [g.find('p1', 'hand', NERO)]);
    accept(g);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c3);
    expect(trash(g, 'p1')).toEqual([NERO]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(don(g, 'p1').active).toBe(1);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('"up to 1": the card may be left on the deck after the cost is paid', () => {
    const g = start();
    act(g);
    pick(g, [g.find('p1', 'hand', NERO)]);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(trash(g, 'p1')).toEqual([NERO]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('a card that is not a "CP" type cannot pay: not offered with only other cards in hand', () => {
    expect(canAct(start({ hand: [BLUE, V.c2] }))).toBe(false);
  });

  it('needs 2 active DON!!', () => {
    expect(canAct(start({ active: 1 }))).toBe(false);
    expect(canAct(start({ active: 2 }))).toBe(true);
  });

  it('a rested Leader cannot pay the rest cost', () => {
    expect(canAct(start({ leader: { card: ID, rested: true } }))).toBe(false);
  });
});
