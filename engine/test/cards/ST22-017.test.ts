/** ST22-017 Fire Fist. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, expectDecision, hand, none, pick, play, trash } from './helpers.ts';
import { trigGame } from './helpers-op11g1.ts';
import { ALLY1, choices, deckOf, mk, V, WB4, WB5 } from './helpers-lfb.ts';

const ID = 'ST22-017';

describe('ST22-017 Fire Fist', () => {
  const start = (handCards: string[] = [WB4, WB5, V.c1]) =>
    mk(
      {
        characters: [V.c3, V.c6],
        hand: [ID, ...handCards] as never,
        deck: [V.c2, V.c4, V.c5] as never,
      },
      { characters: [V.c5, V.c7] },
    );

  it("[Main]: reveal 2 {Whitebeard Pirates} cards: draw 1, then place up to 1 Character with a cost of 5 or less at the bottom of its owner's deck", () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', WB4), g.find('p1', 'hand', WB5)]);
    expect(
      g.eventsOfType('CardRevealed').filter((e) => 'reason' in e && e.reason === 'cost'),
    ).toHaveLength(2);
    expect(hand(g, 'p1')).toContain(V.c2);
    // Either side's Characters of cost 5 or less: mine V.c3, theirs V.c5 (cost 5); not V.c6 / V.c7.
    expect(choices(g).sort()).toEqual(
      [g.find('p1', 'characters', V.c3), g.find('p2', 'characters', V.c5)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c7]);
    expect(deckOf(g, 'p2').at(-1)).toBe(V.c5);
  });

  it('may place one of your own Characters, or none ("up to 1")', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', WB4), g.find('p1', 'hand', WB5)]);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(deckOf(g, 'p1').at(-1)).toBe(V.c3);
    const h = start();
    play(h, ID);
    accept(h);
    pick(h, [h.find('p1', 'hand', WB4), h.find('p1', 'hand', WB5)]);
    none(h);
    expect(h.zone('p1', 'characters')).toHaveLength(2);
    expect(h.zone('p2', 'characters')).toHaveLength(2);
  });

  it('the cost is optional: declining draws nothing and places nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([WB4, WB5, V.c1]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('types that include "Whitebeard Pirates" pay; with only 1 such card the cost cannot be paid', () => {
    const g = start([ALLY1, WB4, V.c1]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', ALLY1), g.find('p1', 'hand', WB4)]);
    expect(hand(g, 'p1')).toContain(V.c2);
    const h = start([WB4, V.c1, V.c2]);
    play(h, ID);
    if (dec(h)?.kind === 'optional') {
      expect(h.decider).toBe('p1');
      expect(h.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(h);
    }
    expect(hand(h, 'p1')).toHaveLength(3);
  });

  describe('[Trigger]', () => {
    const trig = (chars: string[] = [V.c3, V.c4]) =>
      trigGame(ID, { characters: chars as never }, [V.c2, V.c6, V.c1]);

    it("return up to 1 Character with a cost of 3 or less to its owner's hand", () => {
      const g = trig();
      g.act({ type: 'trigger', activate: true });
      // Cost 3 or less, either side: mine V.c3 (3), theirs V.c2 (2) and V.c1 (1); not V.c4 (4), V.c6 or the attacker.
      expect(choices(g)).toHaveLength(3);
      expect(choices(g)).not.toContain(g.find('p1', 'characters', V.c4));
      pick(g, [g.find('p2', 'characters', V.c2)]);
      expect(hand(g, 'p2')).toEqual([V.c2]);
    });

    it('"up to 1": may return nothing', () => {
      const g = trig();
      g.act({ type: 'trigger', activate: true });
      none(g);
      expect(g.zone('p2', 'characters')).toHaveLength(4);
    });
  });
});
