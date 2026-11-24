/** OP11-067 Charlotte Katakuri. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, none, pick, V } from './helpers.ts';
import { BM_P5, BM_P6, BM_Y2, BM_Y4, canPick, mk } from './helpers-op11g2.ts';

const ID = 'OP11-067';
const rested = (card: string) => ({ card, rested: true });
const isRested = (g: ReturnType<typeof mk>, c: string, nth = 0) =>
  g.card(g.find('p1', 'characters', c, nth)).rested;
const start = (characters: unknown[], costArea = { active: 5, rested: 0 }) =>
  mk({ characters: characters as string[], costArea });

describe('OP11-067 Charlotte Katakuri', () => {
  it('[End of Your Turn]: sets up to 2 rested {Big Mom Pirates} Characters with cost 3 or more as active, then adds 1 rested DON!!', () => {
    const g = start([ID, rested(BM_P5), rested(BM_P6), rested(BM_Y4)]);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', BM_P5), g.find('p1', 'characters', BM_P6)]);
    expect(isRested(g, BM_P5)).toBe(false);
    expect(isRested(g, BM_P6)).toBe(false);
    expect(isRested(g, BM_Y4)).toBe(true); // a third one is not allowed
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 4, rested: 1 });
  });

  it('only {Big Mom Pirates} Characters with cost 3 or more are offered (cost 2 and other types are not)', () => {
    const g = start([ID, rested(BM_Y2), rested(BM_Y4), rested(V.c5)]);
    g.act({ type: 'endTurn' });
    expect(canPick(g, g.find('p1', 'characters', BM_Y4))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true); // this card is cost 8 {Big Mom Pirates}
    expect(canPick(g, g.find('p1', 'characters', BM_Y2))).toBe(false); // cost 2
    expect(canPick(g, g.find('p1', 'characters', V.c5))).toBe(false); // not {Big Mom Pirates}
  });

  it('"up to 2": may set only 1, or none; the DON!! is still added', () => {
    const g = start([ID, rested(BM_P5), rested(BM_P6)]);
    g.act({ type: 'endTurn' });
    pick(g, [g.find('p1', 'characters', BM_P5)]);
    expect(isRested(g, BM_P6)).toBe(true);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 1 });
    const h = start([ID, rested(BM_P5)]);
    h.act({ type: 'endTurn' });
    none(h);
    expect(isRested(h, BM_P5)).toBe(true);
    addMost(h);
    expect(don(h, 'p1')).toMatchObject({ rested: 1 });
  });

  it('"up to 1 DON!!": may add none; the added DON!! is rested, not active', () => {
    const g = start([ID]);
    g.act({ type: 'endTurn' });
    if (g.legal().some((a) => a.type === 'done')) none(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.length).toBeGreaterThan(1);
    g.act({ type: 'pick', choice: { option: d.options!.at(-1)!.id } });
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 0, deck: 5 });
  });

  it("must not fire at the end of the opponent's turn", () => {
    const g = mk(
      { characters: [ID, rested(BM_P5)] as string[], costArea: { active: 5, rested: 0 } },
      {},
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'endTurn' });
    // No prompt: the effect is for the end of YOUR turn (p1 is now in its own Main Phase).
    expectDecision(g, 'main', 'p1');
  });

  it('[Blocker]: printed', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c7] }, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });
});
