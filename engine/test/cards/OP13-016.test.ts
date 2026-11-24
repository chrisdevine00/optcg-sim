/** OP13-016 Monkey.D.Garp. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, none, pick, play, V } from './helpers.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { ACE_LEADER, LUFFY_LEADER, mk, PLAIN_BLUE, SABO_LEADER } from './helpers-op13g1.ts';

const ID = 'OP13-016';

describe('OP13-016 Monkey.D.Garp', () => {
  // Top 4: cost 2, cost 3, cost 1, cost 6; then 6 fillers.
  const DECK = [V.c2, V.c3, V.c1, V.c6, BLUE, BLUE, BLUE, BLUE, BLUE, BLUE];
  const start = (leader: string) => mk({ leader, hand: [ID], deck: DECK });

  it.each([
    ['[Monkey.D.Luffy]', LUFFY_LEADER],
    ['[Sabo]', SABO_LEADER],
    ['[Portgas.D.Ace]', ACE_LEADER],
  ])(
    'with a %s Leader: looks at 4, adds up to 1 card with cost 3 or more, the rest to the bottom',
    (_n, leader) => {
      const g = start(leader);
      play(g, ID);
      pick(g, [g.find('p1', 'deck', V.c6)]);
      finishOrder(g);
      expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([V.c6]);
      const deck = g.zone('p1', 'deck').map((c) => c.card);
      expect(deck.slice(0, 6)).toEqual([BLUE, BLUE, BLUE, BLUE, BLUE, BLUE]);
      expect(deck.slice(6).sort()).toEqual([V.c1, V.c2, V.c3].sort());
    },
  );

  it('boundary: cost 3 is offered, cost 2 and cost 1 are not', () => {
    const g = start(LUFFY_LEADER);
    play(g, ID);
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered.sort()).toEqual([g.find('p1', 'deck', V.c3), g.find('p1', 'deck', V.c6)].sort());
  });

  it('with any other Leader nothing happens: no look, the deck is untouched', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual(DECK);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('"up to 1": may take nothing; all 4 go to the bottom', () => {
    const g = start(LUFFY_LEADER);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 6)).toEqual([BLUE, BLUE, BLUE, BLUE, BLUE, BLUE]);
    expect(deck.slice(6).sort()).toEqual([V.c1, V.c2, V.c3, V.c6].sort());
  });

  it('the Leader test is the name: a different Leader of the same type does not count', () => {
    // [Edward.Newgate] is a {Whitebeard Pirates} Leader like [Portgas.D.Ace], but not named so.
    const g = start('OP02-001');
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual(DECK);
  });
});
