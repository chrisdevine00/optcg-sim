/** OP15-037 The Outcome Will Tell Us Who's Strong and Who's Weak. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, times, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { DR, EB, mk, RED_LEADER } from './helpers-op15g1.ts';

const ID = 'OP15-037';

describe("OP15-037 The Outcome Will Tell Us Who's Strong and Who's Weak", () => {
  // Top 5: this Event itself (an {East Blue} card), a non-East Blue, a Dressrosa, two East Blue.
  const top5 = [ID, V.c1, DR.c2, EB.c1, EB.c5];
  const start = () => mk({ hand: [ID], deck: [...top5, ...times(5, BLUE)] });

  it('[Main]: reveals up to 1 {East Blue} card from the top 5 into your hand, the rest go to the bottom', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'deck', EB.c1)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([EB.c1]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(9);
    expect(deck.slice(0, 5)).toEqual(times(5, BLUE));
    expect(deck.slice(5).sort()).toEqual([ID, V.c1, DR.c2, EB.c5].sort());
  });

  it('only {East Blue} cards other than this Event are candidates (itself, other types excluded)', () => {
    const g = start();
    play(g, ID);
    const choices = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : ''));
    expect(choices).toHaveLength(2);
    expect(choices).toContain(g.find('p1', 'deck', EB.c1));
    expect(choices).toContain(g.find('p1', 'deck', EB.c5));
    expect(choices).not.toContain(g.find('p1', 'deck', ID));
  });

  it('boundary: only the top 5 are looked at (an East Blue card in 6th place is not offered)', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, EB.c1, ...times(4, BLUE)] });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0); // nothing to take
    none(g);
    expectDecision(g, 'order', 'p1');
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = start();
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(
      g
        .zone('p1', 'deck')
        .slice(5)
        .map((c) => c.card)
        .sort(),
    ).toEqual([...top5].sort());
  });

  it('[Trigger]: draws 1 card', () => {
    const g = damageGame(ID, { leader: RED_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p1', 'deck')).toHaveLength(9);
  });
});
