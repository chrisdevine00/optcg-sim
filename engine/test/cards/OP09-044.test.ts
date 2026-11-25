/** OP09-044 Izo. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, trash, V } from './helpers.ts';
import { canPick, FWB3, mk, settle, TB4, WANO1, WB4, WBA1 } from './helpers-a09g2.ts';

const ID = 'OP09-044';
const attack = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
const deck5 = [V.c1, WANO1, WB4, TB4, V.c2];

describe('OP09-044 Izo', () => {
  it('[When Attacking]: adds a {Land of Wano} card to your hand, the rest to the bottom, then trash 1', () => {
    const g = mk({ characters: [ID], hand: [V.c3], deck: [...deck5, V.c4, V.c5] });
    attack(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', WANO1)]);
    expect(hand(g, 'p1')).toEqual([V.c3, WANO1]);
    settle(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 2)).toEqual([V.c4, V.c5]);
    expect(deck.slice(2).sort()).toEqual([V.c1, WB4, TB4, V.c2].sort());
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(trash(g, 'p1')).toEqual([V.c3]);
    expect(hand(g, 'p1')).toEqual([WANO1]);
  });

  it('selectable: {Land of Wano} and any type including "Whitebeard Pirates" (substring), nothing else', () => {
    const g = mk({
      characters: [ID],
      deck: [WANO1, WB4, FWB3, WBA1, TB4, V.c1],
    });
    attack(g);
    expect(canPick(g, g.find('p1', 'deck', WANO1))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', WB4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', FWB3))).toBe(true); // Former Whitebeard Pirates
    expect(canPick(g, g.find('p1', 'deck', WBA1))).toBe(true); // Whitebeard Pirates Allies
    expect(canPick(g, g.find('p1', 'deck', TB4))).toBe(false);
  });

  it('"up to 1": two matching cards cannot both be taken', () => {
    const g = mk({ characters: [ID], deck: [WANO1, WB4, V.c1, V.c2, V.c3, V.c4] });
    attack(g);
    expect(() => pick(g, [g.find('p1', 'deck', WANO1), g.find('p1', 'deck', WB4)])).toThrow(
      /can be picked now/,
    );
  });

  it('taking nothing still trashes 1 card from your hand', () => {
    const g = mk({ characters: [ID], hand: [V.c3], deck: [...deck5, V.c4] });
    attack(g);
    none(g);
    settle(g);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(trash(g, 'p1')).toEqual([V.c3]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
  });

  it('a card taken with an empty hand can itself be trashed; nothing is asked for an empty hand otherwise', () => {
    const g = mk({ characters: [ID], deck: [...deck5, V.c4] });
    attack(g);
    pick(g, [g.find('p1', 'deck', WB4)]);
    settle(g);
    pick(g, [g.find('p1', 'hand', WB4)]);
    expect(trash(g, 'p1')).toEqual([WB4]);
    const h = mk({ characters: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6] });
    attack(h);
    none(h);
    settle(h);
    expect(dec(h)?.kind).not.toBe('choose');
  });
});
