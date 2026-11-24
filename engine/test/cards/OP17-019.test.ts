/** OP17-019 I Don't Have Time to Chat with Snot-Nosed Brats. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { damageGame, orderAll } from './helpers-hancock-rosi.ts';
import { ATMOS, DOMA, KINGDEW, RED_LEADER } from './helpers-op17g1.ts';

const ID = 'OP17-019';

describe("OP17-019 I Don't Have Time to Chat with Snot-Nosed Brats", () => {
  const start = (top: string[]) =>
    game(
      {
        leader: RED_LEADER,
        hand: [ID],
        deck: [...top, BLUE, BLUE, BLUE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[Main] look at 5, reveal up to 1 "Whitebeard Pirates" card into your hand, the rest to the bottom in any order', () => {
    const g = start([V.c1, ATMOS, V.c2, V.c3, V.c4]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', ATMOS)]);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([ATMOS]);
    expect(g.eventsOfType('CardRevealed').map((e) => e.card)).toContain(ATMOS);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(7); // 8 cards minus the one taken
    expect(deck.slice(0, 3)).toEqual([BLUE, BLUE, BLUE]); // the unlooked cards stay on top
    expect(deck.slice(3).sort()).toEqual([V.c1, V.c2, V.c3, V.c4].sort());
  });

  it('a type including "Whitebeard Pirates" matches {Whitebeard Pirates Allies}; non-matching cards are not candidates', () => {
    const g = start([V.c1, DOMA, V.c2, V.c3, V.c4]);
    play(g, ID);
    const candidates = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(candidates).toEqual([g.find('p1', 'deck', DOMA)]);
  });

  it('"up to 1": takes one of two candidates, or none', () => {
    const g = start([ATMOS, KINGDEW, V.c2, V.c3, V.c4]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', KINGDEW)]);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([KINGDEW]);
    const g2 = start([ATMOS, KINGDEW, V.c2, V.c3, V.c4]);
    play(g2, ID);
    none(g2);
    orderAll(g2);
    expect(hand(g2, 'p1')).toEqual([]);
    expect(g2.zone('p1', 'deck')).toHaveLength(8); // all 5 looked-at cards at the bottom
  });

  it('only the top 5 are looked at: a candidate in 6th place is out of reach', () => {
    const g = start([V.c1, V.c2, V.c3, V.c4, V.c5, ATMOS]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    if (dec(g)?.kind === 'choose') none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[Trigger] your Leader gains +1000 power during this turn', () => {
    const g = damageGame(ID, { leader: RED_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });
});
