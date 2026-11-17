/** OP14-105 Gorgon Sisters. */
import { describe, expect, it } from 'vitest';
import { BLUE, don, expectDecision, game, hand, pick, PLAIN_BLUE, V } from './helpers.ts';
import { HANCOCK, KUJA, LILY, ROSI } from './helpers-hancock-rosi.ts';
import { damageWith } from './triggers.ts';

describe('OP14-105 Gorgon Sisters', () => {
  const start = (handCards: string[], rested = 5, chars: string[] = [KUJA]) =>
    game(
      {
        leader: HANCOCK,
        characters: ['OP14-105', ...chars],
        hand: handCards,
        costArea: { active: 0, rested },
      },
      { leader: PLAIN_BLUE },
    );
  const use = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', 'OP14-105'), ability: 'give' });

  it('[Activate: Main] reveals 3 {Amazon Lily}/{Kuja Pirates} cards, then gives your Leader and each Character 1 rested DON!!', () => {
    const g = start([KUJA, LILY, KUJA, BLUE]);
    use(g);
    // Only the three matching cards can be revealed: the cost is exactly 3 of 3.
    pick(g, [
      g.find('p1', 'hand', KUJA, 0),
      g.find('p1', 'hand', KUJA, 1),
      g.find('p1', 'hand', LILY),
    ]);
    expect(g.eventsOfType('CardRevealed').filter((e) => e.reason === 'cost')).toHaveLength(3);
    expect(hand(g, 'p1')).toHaveLength(4);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.card(g.find('p1', 'characters', 'OP14-105')).don).toBe(1);
    expect(g.card(g.find('p1', 'characters', KUJA)).don).toBe(1);
    expect(don(g, 'p1').rested).toBe(2);
  });

  it('is not offered with fewer than 3 matching cards in hand', () => {
    const g = start([KUJA, LILY, BLUE, V.c1]);
    expect(g.legal().some((a) => a.type === 'activate' && a.ability === 'give')).toBe(false);
  });

  it('is once per turn', () => {
    const g = start([KUJA, LILY, KUJA, KUJA]);
    use(g);
    pick(g, [
      g.find('p1', 'hand', KUJA, 0),
      g.find('p1', 'hand', KUJA, 1),
      g.find('p1', 'hand', LILY),
    ]);
    expect(g.legal().some((a) => a.type === 'activate' && a.ability === 'give')).toBe(false);
  });

  it('with fewer rested DON!! than targets the player chooses who gets one', () => {
    const g = start([KUJA, LILY, KUJA], 2, [KUJA]);
    use(g);
    pick(g, [
      g.find('p1', 'hand', KUJA, 0),
      g.find('p1', 'hand', KUJA, 1),
      g.find('p1', 'hand', LILY),
    ]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1'), g.find('p1', 'characters', KUJA)]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.card(g.find('p1', 'characters', KUJA)).don).toBe(1);
    expect(g.card(g.find('p1', 'characters', 'OP14-105')).don).toBe(0);
  });

  it('[Trigger] with a {Kuja Pirates} Leader plays this card', () => {
    const g = damageWith('OP14-105', { leader: HANCOCK });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP14-105']);
  });

  it('[Trigger] with another Leader does not', () => {
    const g = damageWith('OP14-105', { leader: ROSI });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
