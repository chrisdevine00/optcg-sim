/** EB05-011 Otohime. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';

const ID = 'EB05-011';
/** OP11-022 Shirahoshi Leader ({Merfolk}). */
const SHIRAHOSHI = 'OP11-022';

const start = (
  leader: string = SHIRAHOSHI,
  life: (string | { card: string; faceUp: boolean })[] = [{ card: BLUE, faceUp: true }, BLUE],
  opp: Parameters<typeof game>[1]['characters'] = [V.c5, V.c6],
) =>
  game(
    { leader, hand: [ID], life, costArea: { active: 1, rested: 0 } },
    { leader: PLAIN_BLUE, characters: opp },
  );

describe('EB05-011 Otohime', () => {
  it("[On Play]: with [Shirahoshi] as Leader, turn the top Life card face-down: rest up to 1 of your opponent's Characters with a cost of 5 or less", () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
    // Turning a Life card face-down does not move it.
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('the cost is optional: declining keeps the Life card face-up and rests nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
    expectDecision(g, 'main', 'p1');
  });

  it('a cost 6 Character is not a candidate, and "up to 1" may be left empty', () => {
    const g = start(SHIRAHOSHI, undefined, [V.c6, V.c5]);
    play(g, ID);
    accept(g);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
    // The cost was paid even though nothing was rested.
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });

  it('does nothing when the Leader is not [Shirahoshi]: no cost is offered', () => {
    const g = start(PLAIN_PURPLE);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('cannot be paid when the top Life card is face-down', () => {
    const g = start(SHIRAHOSHI, [BLUE, BLUE]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });
});
