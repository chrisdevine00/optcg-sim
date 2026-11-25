/** OP09-037 Lim. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick, mk, OD4, settle } from './helpers-a09g2.ts';

const ID = 'OP09-037';
const R = (card: string) => ({ card, rested: true });
const endTurn = (g: ReturnType<typeof mk>) => g.act({ type: 'endTurn' });
const rested = (g: ReturnType<typeof mk>) => g.card(g.find('p1', 'characters', ID)).rested;

describe('OP09-037 Lim', () => {
  it('[On Play]: adds an {ODYSSEY} card other than [Lim]; the other 4 go to the bottom in any order', () => {
    const g = mk({ hand: [ID], deck: [V.c1, ID, OD4, V.c2, V.c3, V.c4, V.c5] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', OD4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false); // another [Lim]
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'deck', OD4)]);
    expect(hand(g, 'p1')).toEqual([OD4]);
    settle(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 2)).toEqual([V.c4, V.c5]);
    expect(deck.slice(2).sort()).toEqual([V.c1, ID, V.c2, V.c3].sort());
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = mk({ hand: [ID], deck: [OD4, V.c1, V.c2, V.c3, V.c4, V.c5] });
    play(g, ID);
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(V.c5);
  });

  it('looks only at the top 5: an {ODYSSEY} card in 6th place is not offered', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, OD4] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('[End of Your Turn] with 3 rested Characters (herself included): sets herself active', () => {
    const g = mk({ characters: [R(ID), R(V.c1), R(V.c2)] });
    endTurn(g);
    expect(rested(g)).toBe(false);
  });

  it('boundary: 2 rested Characters leave her rested and nothing is asked', () => {
    const g = mk({ characters: [R(ID), R(V.c1), V.c2] });
    endTurn(g);
    expect(rested(g)).toBe(true);
    expect(dec(g)?.kind).not.toBe('choose');
  });

  it('the opponent rested Characters do not count', () => {
    const g = mk({ characters: [R(ID), R(V.c1)] }, { characters: [R(V.c1), R(V.c2)] });
    endTurn(g);
    expect(rested(g)).toBe(true);
  });
});
