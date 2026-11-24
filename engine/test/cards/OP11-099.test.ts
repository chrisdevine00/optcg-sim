/** OP11-099 I'm Gonna Be a Navy Officer!!! (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import { accept, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick, damageGame, idsOf, mk, NAVY_B1, NAVY_B3, NAVY_LEADER } from './helpers-op11g3.ts';

const ID = 'OP11-099';

describe("OP11-099 I'm Gonna Be a Navy Officer!!!", () => {
  const start = (deck: string[]) => mk({ hand: [ID], deck: [...deck, V.c6, V.c6, V.c6, V.c6] });

  it('[Main]: look at 3, reveal up to 1 "Navy" card other than this card and add it to your hand; trash the rest', () => {
    const g = start([V.c1, NAVY_B1, V.c2]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', NAVY_B1))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'deck', NAVY_B1)]);
    expect(hand(g, 'p1')).toEqual([NAVY_B1]);
    expect(idsOf(g, 'p1', 'trash').sort()).toEqual([ID, V.c1, V.c2].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(4);
    expectDecision(g, 'main', 'p1');
  });

  it("another copy of the card itself cannot be taken (other than [I'm Gonna Be a Navy Officer!!!])", () => {
    const g = start([ID, V.c3, NAVY_B3]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', NAVY_B3))).toBe(true);
    none(g);
    expect(idsOf(g, 'p1', 'trash')).toHaveLength(4);
  });

  it('only the top 3 cards are looked at', () => {
    const g = start([V.c1, V.c2, V.c3, NAVY_B1]);
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    if (g.legal().some((a) => a.type === 'done')) none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(NAVY_B1);
  });

  it('"up to 1": taking nothing trashes all 3', () => {
    const g = start([NAVY_B1, NAVY_B3, V.c2]);
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toHaveLength(4);
  });

  it('[Trigger]: activates its [Main] effect', () => {
    const g = damageGame(ID, {
      leader: NAVY_LEADER,
      deck: [NAVY_B1, V.c1, V.c2, V.c3],
    });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'deck', NAVY_B1)]);
    expect(hand(g, 'p1')).toEqual([NAVY_B1]);
    expect(idsOf(g, 'p1', 'trash')).toHaveLength(3);
  });

  it('accepting nothing else: the Event asks no cost', () => {
    const g = start([V.c1, V.c2, V.c3]);
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    void accept;
  });
});
