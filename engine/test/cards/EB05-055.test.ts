/** EB05-055 Nami: [Your Turn] [On Play] If your Leader has the "Wisdom" attribute, add up to 1 card from the top of your deck to the top of your Life cards. [Trigger] You may trash 1 card from your hand: If you have 2 or less Life cards, play this card. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  pick,
  play,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { triggerHit } from './helpers-robin.ts';

const NAMI = 'EB05-055';
/** OP03-040 Nami (Leader): Wisdom attribute. ST04-001 Kaido (PLAIN_PURPLE): Strike. */
const WISDOM_LEADER = 'OP03-040';

describe('EB05-055 Nami', () => {
  const setup = (leader: string) =>
    game(
      { leader, hand: [NAMI], deck: [V.c1, V.c2, V.c3], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_PURPLE },
    );

  it('[Your Turn][On Play] with a Wisdom Leader: adds the top deck card to the top of your Life', () => {
    const g = setup(WISDOM_LEADER);
    play(g, NAMI);
    accept(g);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c1);
    expect(g.zone('p1', 'deck')).toHaveLength(2);
  });

  it('[On Play] "up to 1": may add nothing', () => {
    const g = setup(WISDOM_LEADER);
    play(g, NAMI);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('[On Play] without a Wisdom Leader nothing happens', () => {
    const g = setup(PLAIN_PURPLE);
    play(g, NAMI);
    expectDecision(g, 'main', 'p1');
    expect(g.life('p1')).toBe(3);
  });

  it('[Trigger] trash 1 card from hand: with 2 or less Life cards left, plays this card', () => {
    const g = triggerHit(NAMI, { hand: [BLUE] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([NAMI]);
  });

  it("[Your Turn]: played by a [Trigger] on the opponent's turn the [On Play] does not add Life", () => {
    const g = triggerHit(NAMI, { hand: [BLUE], leader: WISDOM_LEADER, deck: [V.c1, V.c2, V.c3] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([NAMI]);
    // One Life card was left after the damage; the [On Play] adds none on the opponent's turn.
    expect(g.life('p1')).toBe(1);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('[Trigger] with 3 Life cards left the card is not played', () => {
    const g = triggerHit(NAMI, { hand: [BLUE], life: [NAMI, BLUE, BLUE, BLUE] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
