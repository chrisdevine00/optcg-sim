/** EB05-057 Nojiko: [Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to 1 of your Leader or Character cards with the "Special" or "Wisdom" Attribute. [Trigger] If you have 2 or less Life cards, play up to 1 Character card with 6000 power or less and a [Trigger] from your hand. */
import { describe, expect, it } from 'vitest';
import { BLUE, don, expectDecision, game, none, pick, PLAIN_PURPLE, V } from './helpers.ts';
import { TRIG, TRIG5, triggerHit } from './helpers-robin.ts';

const NOJIKO = 'EB05-057';
/** OP03-040 Nami (Leader), Wisdom. ST04-001 Kaido (PLAIN_PURPLE) is Strike; V.c1 Blugori is Slash; BLUE Mohji is Wisdom. */
const WISDOM_LEADER = 'OP03-040';
/** OP02-080 Dobon: Strike. OP01-110 Fukurokuju: Special. */
const STRIKE = 'OP02-080';
const SPECIAL = 'OP01-110';

describe('EB05-057 Nojiko', () => {
  const setup = (chars: string[], rested = 1, leader = PLAIN_PURPLE) =>
    game(
      { leader, characters: [NOJIKO, ...chars], costArea: { active: 0, rested } },
      { leader: PLAIN_PURPLE },
    );
  const activate = (g: ReturnType<typeof setup>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', NOJIKO), ability: 'give' });

  it('[Activate: Main] gives 1 rested DON!! to a Special or Wisdom Character (Nojiko herself is Wisdom)', () => {
    const g = setup([STRIKE, SPECIAL]);
    activate(g);
    // Candidates: Nojiko (Wisdom) and the Special one; the Strike Character and Strike Leader are not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'characters', SPECIAL)]);
    expect(g.card(g.find('p1', 'characters', SPECIAL)).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 0 });
  });

  it('[Activate: Main] may target a Wisdom Leader', () => {
    const g = setup([], 1, WISDOM_LEADER);
    activate(g);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('[Activate: Main] is once per turn', () => {
    const g = setup([SPECIAL], 2);
    activate(g);
    pick(g, [g.find('p1', 'characters', SPECIAL)]);
    expect(
      g.isLegal({
        type: 'activate',
        card: g.find('p1', 'characters', NOJIKO),
        ability: 'give',
        player: 'p1',
      }),
    ).toBe(false);
  });

  it('[Activate: Main] with no rested DON!! nothing is given', () => {
    const g = setup([SPECIAL], 0);
    activate(g);
    expect(g.card(g.find('p1', 'characters', SPECIAL)).don).toBe(0);
    expect(g.card(g.find('p1', 'characters', NOJIKO)).don).toBe(0);
  });

  it('[Activate: Main] with only non-matching cards nothing can be chosen but Nojiko', () => {
    const g = setup([V.c1, STRIKE]);
    activate(g);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'characters', NOJIKO)]);
    expect(g.card(g.find('p1', 'characters', NOJIKO)).don).toBe(1);
  });

  describe('[Trigger]', () => {
    it('with 2 or less Life cards: plays a Character with 6000 power or less and a [Trigger] from hand', () => {
      const g = triggerHit(NOJIKO, { hand: [TRIG, TRIG5, BLUE] });
      g.act({ type: 'trigger', activate: true });
      // TRIG (4000) and TRIG5 (5000) have a [Trigger]; BLUE has none.
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
      pick(g, [g.find('p1', 'hand', TRIG5)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([TRIG5]);
    });

    it('"up to 1": may play nothing', () => {
      const g = triggerHit(NOJIKO, { hand: [TRIG] });
      g.act({ type: 'trigger', activate: true });
      none(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });

    it('with 3 Life cards left nothing is played', () => {
      const g = triggerHit(NOJIKO, { hand: [TRIG], life: [NOJIKO, BLUE, BLUE, BLUE] });
      g.act({ type: 'trigger', activate: true });
      expectDecision(g, 'main', 'p2');
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });
  });
});
