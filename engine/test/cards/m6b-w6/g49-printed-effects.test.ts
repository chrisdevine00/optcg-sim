/**
 * M6b wave 6, G49: filters on printed effects, "a Character with no base effect" (EB02-022,
 * EB03-003, 007, 009, 039) and "without a [When Attacking] effect" (EB03-001, PRB01-001). They read
 * the card's verified text, not its script, so a card that is not scripted reads the same as one
 * that is (the audit's section 5.2 trap). Planted on real vanilla and text cards; each test fails
 * with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities } from '../../../src/testing.ts';
import { BLUE, game, hand, PLAIN_BLUE, PLAIN_PURPLE } from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

// Real Characters, by what their printed text has (cards/data).
const VANILLA = 'EB01-005'; // no text at all
const BLOCKER = 'EB01-017'; // [Blocker] and its reminder text only
const RUSH = 'OP01-025'; // [Rush] and its reminder text only
const TRIGGER = 'OP01-009'; // no effect text, a [Trigger]
const ON_PLAY = 'EB01-015'; // [On Play]
const WHEN_ATT = 'EB01-004'; // [When Attacking]
const RUSH_WA = 'EB01-003'; // [Rush] and a [When Attacking]

/** "Draw a card for each of your Characters matching the filter." */
const countOf = (filter: unknown) => ({
  do: { draw: { count: { from: 'characters', owner: 'you', filter } } },
});

const drawn = (chars: string[], filter: unknown, strip = true): number => {
  const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, ...chars] }, { leader: PLAIN_BLUE });
  g.state = withAbilities(g.state, BLUE, [main([countOf(filter)] as never)]);
  // Whatever script a real card has, the printed text is what the filter reads.
  if (strip) for (const id of chars) g.state = withAbilities(g.state, id, []);
  const before = hand(g, 'p1').length;
  run(g);
  return hand(g, 'p1').length - before;
};

describe('G49 filters on printed effects', () => {
  it('validates, and refuses the nonsense', () => {
    main([countOf({ hasBaseEffect: false })] as never);
    main([countOf({ not: { hasTiming: 'whenAttacking' } })] as never);
    const bad = (f: unknown) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: [countOf(f)] });
    expect(bad({ hasBaseEffect: 'no' })).not.toEqual([]);
    expect(bad({ hasTiming: 'onTuesday' })).not.toEqual([]);
    expect(bad({ hasTiming: ['onPlay'] })).not.toEqual([]);
  });

  it('"no base effect": a card with no text, or only keywords, has none', () => {
    // The probe card (BLUE) is itself a vanilla Character of the board.
    expect(drawn([VANILLA, BLOCKER, RUSH], { hasBaseEffect: false })).toBe(4);
    expect(drawn([VANILLA, BLOCKER, RUSH], { hasBaseEffect: true })).toBe(0);
  });

  it('a [Trigger] or any other text is a base effect (M6b-Q70)', () => {
    expect(drawn([TRIGGER, ON_PLAY, WHEN_ATT], { hasBaseEffect: true })).toBe(3);
    expect(drawn([TRIGGER, ON_PLAY, WHEN_ATT], { hasBaseEffect: false })).toBe(1);
  });

  it('reads the printed text, not the script: a card with no script reads the same', () => {
    // Stripped of every ability, as an unscripted card is: it still has its printed effect.
    expect(drawn([ON_PLAY], { hasBaseEffect: true })).toBe(1);
    expect(drawn([ON_PLAY], { hasBaseEffect: false })).toBe(1); // only the probe card
    expect(drawn([ON_PLAY], { hasTiming: 'onPlay' })).toBe(1);
  });

  it('"without a [When Attacking] effect" and "with an [On Play] effect"', () => {
    const wa = { hasTiming: 'whenAttacking' };
    expect(drawn([ON_PLAY, WHEN_ATT, RUSH_WA], wa)).toBe(2);
    expect(drawn([ON_PLAY, WHEN_ATT, RUSH_WA], { not: wa })).toBe(2); // the probe card and [On Play]
    expect(drawn([ON_PLAY, WHEN_ATT, RUSH_WA], { hasTiming: 'onPlay' })).toBe(1);
    expect(drawn([ON_PLAY, WHEN_ATT, RUSH_WA], { not: { hasTiming: 'onPlay' } })).toBe(3);
  });

  it('a printed timing the card does not have does not match, and keywords are not timings', () => {
    expect(drawn([BLOCKER, VANILLA], { hasTiming: 'onPlay' })).toBe(0);
    expect(drawn([BLOCKER, RUSH], { hasTiming: 'whenAttacking' })).toBe(0);
  });

  it('composes with other filters, as "6000 power or less and no base effect" does', () => {
    const f = { all: [{ power: { lte: 6000 } }, { hasBaseEffect: false }] };
    expect(drawn([VANILLA, 'EB01-018', ON_PLAY], f)).toBe(2); // the probe card and Doma; 7000 power fails
  });
});
