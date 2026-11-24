/** OP11-051 Sanji. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  endCounter,
  expectDecision,
  none,
  passBlock,
  pick,
  play,
  PURPLE,
  times,
  V,
} from './helpers.ts';
import { koBy, plantKo } from './helpers-w3s.ts';
import { boost, canPick, cardsOf, finishOrder, mk, SHC1, SHC4, SHC5 } from './helpers-op11g2.ts';

const ID = 'OP11-051';
const SHC6 = 'OP05-065'; // {Straw Hat Crew}, cost 6
// Top 5: {SHC} cost 4, {SHC} cost 5, {SHC} cost 6, a plain card, {SHC} cost 1; the 6th is another {SHC} cost 4.
const top5 = [SHC4, SHC5, SHC6, V.c2, SHC1];
const deck = [...top5, SHC4, ...times(4, BLUE)];

/** p1's Sanji is K.O.'d by an effect of p2's Character (planted Activate: Main on a vanilla). */
const koedByOpponent = () => {
  const g = mk(
    { characters: [ID], deck },
    { characters: [PURPLE] },
    { turn: 4, activePlayer: 'p2' },
  );
  plantKo(g, PURPLE);
  g.act({ type: 'activate', card: g.find('p2', 'characters', PURPLE), ability: 'k' });
  return g;
};

describe('OP11-051 Sanji', () => {
  it("K.O.'d by your opponent's effect: looks at 5 and plays a {Straw Hat Crew} Character with cost 5 or less (cost 6 and other types are not offered)", () => {
    const g = koedByOpponent();
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', SHC4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SHC5))).toBe(true); // cost 5 boundary
    expect(canPick(g, g.find('p1', 'deck', SHC6))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', V.c2))).toBe(false);
    pick(g, [g.find('p1', 'deck', SHC5)]);
    finishOrder(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([SHC5]);
    const d = cardsOf(g, 'p1', 'deck');
    expect(d).toHaveLength(deck.length - 1); // one card was played
    expect(d[0]).toBe(SHC4); // the 6th card was not looked at
    expect(d.slice(-4).sort()).toEqual([SHC4, SHC6, V.c2, SHC1].sort());
  });

  it('"up to 1": may play nothing; all 5 go to the bottom', () => {
    const g = koedByOpponent();
    none(g);
    finishOrder(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck').slice(-5).sort()).toEqual([...top5].sort());
  });

  it("K.O.'d in battle: nothing happens", () => {
    const g = mk(
      { characters: [{ card: ID, rested: true }], deck },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ID),
    });
    passBlock(g);
    endCounter(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([]);
    expectDecision(g, 'main', 'p2');
    expect(cardsOf(g, 'p1', 'deck')).toEqual(deck);
  });

  it("K.O.'d by your own effect: nothing happens", () => {
    const g = mk({ characters: [ID], deck }, {}, { turn: 4, activePlayer: 'p2' });
    koBy(g, 'p1', ID, 'p1');
    expect(cardsOf(g, 'p1', 'characters')).toEqual([]);
    expectDecision(g, 'main', 'p2');
    expect(cardsOf(g, 'p1', 'deck')).toEqual(deck);
  });

  it("[On Play]: returns up to 1 Character with 5000 base power or less to its owner's hand (base, not current, power)", () => {
    const g = mk({ hand: [ID], characters: [V.c3] }, { characters: [V.c3, V.c4] });
    boost(g, g.find('p2', 'characters', V.c3), 3000); // current 8000, base 5000: still eligible
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // base 5000 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false); // base 6000
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(true); // your own too
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.zone('p2', 'hand').map((c) => c.card)).toEqual([V.c3]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('[On Play] "up to 1": may return nothing', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c1] });
    play(g, ID);
    none(g);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c1]);
  });
});
