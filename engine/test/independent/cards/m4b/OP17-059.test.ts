/**
 * OP17-059 Aramaki (Character, Purple, cost 7, 8000; Navy / Admiral).
 *
 * Card text: "[Blocker]
 * [On Play] DON!! −1: Draw 1 card and K.O. up to 2 of your opponent's Characters with a cost of 2 or less."
 *
 * Rules: DON!! −1 is an optional cost for an auto effect (asked first, CR 8-3-1-4); it returns a DON!!
 * to the DON!! deck (CR 8-3-1-6); both clauses resolve ("and"); "up to 2" may be 0, 1 or 2 (CR 8-4-4-1);
 * only cost 2 or less (current cost); CR 10-1-4 [Blocker]. Targets: OP02-097 Komille (cost 1), OP02-107
 * Doberman (cost 2), OP01-012 Sai (cost 2), OP02-116 Yamakaji (cost 3).
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  attack,
  blockers,
  BLUE,
  choose,
  chooseNone,
  decline,
  donOf,
  kind,
  LD,
  LEAD,
  myTurn,
  offered,
  payDon,
  playFromHand,
  reachablePickSets,
  RED,
  rep,
  side,
  sortedIds,
  theirTurn,
  V,
  VAN,
} from './kit-d.ts';

const ARAMAKI = 'OP17-059';

function game() {
  return myTurn(
    side(LD.navy, BLUE, {
      hand: [ARAMAKI],
      deck: [VAN.marco, ...rep(BLUE, 10)],
      costArea: { active: 8, rested: 0 },
    }),
    side(LEAD.luffy, RED, { characters: [V.komille, V.doberman, VAN.sai, V.yamakaji] }),
  );
}

function pay(g: ReturnType<typeof game>) {
  playFromHand(g, ARAMAKI);
  accept(g);
  payDon(g, 1);
}

describe('OP17-059 Aramaki [On Play] DON!! −1: draw 1 and K.O. up to 2 Characters with cost 2 or less', () => {
  it('accepting: a DON!! returns to the DON!! deck, 1 card is drawn, up to 2 cost-2-or-less Characters are K.O.’d', () => {
    const g = game();
    const before = donOf(g, 'p1').deck;
    playFromHand(g, ARAMAKI);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1);
    expect(donOf(g, 'p1').deck).toBe(before + 1);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([VAN.marco]);
    choose(g, [g.find('p2', 'characters', V.komille), g.find('p2', 'characters', V.doberman)]);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([V.yamakaji, VAN.sai].sort());
    expect(sortedIds(g, 'p2', 'trash')).toEqual([V.komille, V.doberman].sort());
    expect(kind(g)).toBe('main');
  });

  it('candidates are cost 2 or less only, and never 3 of them (up to 2)', () => {
    const g = game();
    pay(g);
    const sets = [...reachablePickSets(g)];
    for (const s of sets) {
      const cards = s === '' ? [] : s.split('+');
      expect(cards.length).toBeLessThanOrEqual(2);
      expect(cards).not.toContain(V.yamakaji);
    }
    expect(sets).toContain('');
    expect(sets.some((s) => s.split('+').length === 2)).toBe(true);
  });

  it('CR 8-4-4-1: K.O.ing 1 is allowed', () => {
    const g = game();
    pay(g);
    choose(g, [g.find('p2', 'characters', VAN.sai)]);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.sai]);
  });

  it('CR 8-4-4-1: K.O.ing nobody is allowed, and the card is still drawn', () => {
    const g = game();
    pay(g);
    chooseNone(g);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
  });

  it('CR 8-3-1-4: declining the DON!! −1: no draw, no K.O., DON!! unchanged', () => {
    const g = game();
    const before = donOf(g, 'p1').deck;
    playFromHand(g, ARAMAKI);
    decline(g);
    expect(donOf(g, 'p1').deck).toBe(before);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
    expect(kind(g)).toBe('main');
  });

  it('only the opponent’s Characters: your own cost-1 Character is not offered', () => {
    const g = myTurn(
      side(LD.navy, BLUE, {
        hand: [ARAMAKI],
        characters: [V.komille],
        costArea: { active: 8, rested: 0 },
        deck: rep(BLUE, 10),
      }),
      side(LEAD.luffy, RED, { characters: [V.doberman] }),
    );
    playFromHand(g, ARAMAKI);
    accept(g);
    payDon(g, 1);
    const sets = [...reachablePickSets(g)];
    expect(sets).toContain(V.doberman);
    for (const s of sets) expect(s).not.toContain(V.komille);
  });
});

describe('OP17-059 Aramaki: [Blocker]', () => {
  it('it can block on the opponent’s turn', () => {
    const g = theirTurn(side(LD.navy, BLUE, { characters: [ARAMAKI] }), side(LEAD.luffy, RED));
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ARAMAKI)]);
  });
});
