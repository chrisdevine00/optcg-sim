/** ST22-011 Whitey Bay. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_PURPLE,
} from './helpers.ts';
import {
  ALLY1,
  choices,
  FORMER3,
  mk,
  OTHER_LEADER,
  V,
  WB4,
  WB5,
  WB_LEADER,
} from './helpers-lfb.ts';
import { plant } from './helpers-op15g2.ts';
const ID = 'ST22-011';
const costReveals = (g: ReturnType<typeof mk>) =>
  g.eventsOfType('CardRevealed').filter((e) => 'reason' in e && e.reason === 'cost');

describe('ST22-011 Whitey Bay', () => {
  const start = (handCards: string[] = [WB4, WB5, V.c1], leader: string = WB_LEADER) =>
    mk({ leader, hand: [ID, ...handCards] as never });

  it('[Your Turn] [On Play]: reveal 2 {Whitebeard Pirates} cards: your {Whitebeard Pirates} Leader gains +2000 power this turn', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    // Only the {Whitebeard Pirates} cards can be revealed.
    // (A pick of exactly 2 offers cards in canonical order, so check the non-matching card only.)
    expect(choices(g)).not.toContain(g.find('p1', 'hand', V.c1));
    expect(choices(g).length).toBeGreaterThan(0);
    pick(g, [g.find('p1', 'hand', WB4), g.find('p1', 'hand', WB5)]);
    expect(costReveals(g)).toHaveLength(2);
    if (dec(g)?.kind === 'choose') pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    // The revealed cards stay in hand.
    expect(hand(g, 'p1').sort()).toEqual([WB4, WB5, V.c1].sort());
  });

  it('the cost can be declined: no reveal, no power', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(costReveals(g)).toHaveLength(0);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('types that include "Whitebeard Pirates" pay (Allies, Former)', () => {
    const g = start([ALLY1, FORMER3, V.c1]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', ALLY1), g.find('p1', 'hand', FORMER3)]);
    if (dec(g)?.kind === 'choose') pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('must not fire: with only 1 {Whitebeard Pirates} card in hand the cost cannot be paid', () => {
    const g = start([WB4, V.c1, V.c2]);
    play(g, ID);
    if (dec(g)?.kind === 'optional') {
      // Offered (a hand filter is not told), but accepting is not legal.
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the effect does nothing when the Leader is not a {Whitebeard Pirates} Leader', () => {
    const g = start([WB4, WB5], OTHER_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', WB4), g.find('p1', 'hand', WB5)]);
    // "Up to 1 of your Leader with a type...": no candidate, so nothing to choose.
    if (dec(g)?.kind === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("[Your Turn]: played by the opponent's effect during the opponent's turn, it does not fire", () => {
    const g = game(
      { leader: WB_LEADER, hand: [ID, WB4, WB5] as never },
      { leader: PLAIN_PURPLE },
      { turn: 4, activePlayer: 'p2' },
    );
    plant(g, 'p2', {
      play: {
        what: { from: 'hand', owner: 'opponent', chooser: 'opponent', pick: { upTo: 1 } },
        player: 'opponent',
      },
    });
    if (dec(g)?.kind === 'choose') pick(g, [g.find('p1', 'hand', ID)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(costReveals(g)).toHaveLength(0);
  });
});
