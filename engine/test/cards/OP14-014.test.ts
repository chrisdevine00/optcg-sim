/** OP14-014 Eustass"Captain"Kid. */
import { describe, expect, it } from 'vitest';
import { PLAIN_BLUE } from './helpers.ts';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { cardsIn, mk, RED0, RED3, SN2, SN2_GREEN } from './helpers-op14g1.ts';

const ID = 'OP14-014';

describe('OP14-014 Eustass"Captain"Kid', () => {
  it('[Blocker] is printed', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] with a {Supernovas} Leader: plays up to 1 red Character with 2000 power or less from hand', () => {
    const g = mk({ hand: [ID, SN2, RED3, SN2_GREEN, V.c1] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // Red and 2000 or less: SN2 (red 2000) and RED0-like cards; not RED3 (3000), not green, not purple.
    expect(canPick(g, g.find('p1', 'hand', SN2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', RED3))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', SN2_GREEN))).toBe(false);
    pick(g, [g.find('p1', 'hand', SN2)]);
    expect(cardsIn(g, 'p1', 'characters').sort()).toEqual([ID, SN2].sort());
  });

  it('boundary: power 0 is eligible, 3000 is not', () => {
    const g = mk({ hand: [ID, RED0, RED3] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', RED0))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', RED3))).toBe(false);
  });

  it('must not fire when the Leader lacks {Supernovas}: nothing is asked and nothing is played', () => {
    const g = mk({ leader: PLAIN_BLUE, hand: [ID, SN2] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"up to 1": may play nothing (also with no eligible card, the empty choice is asked)', () => {
    const g = mk({ hand: [ID, SN2] });
    play(g, ID);
    none(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    const h = mk({ hand: [ID, V.c1] });
    play(h, ID);
    expectDecision(h, 'choose', 'p1');
    none(h);
    expect(cardsIn(h, 'p1', 'hand')).toEqual([V.c1]);
  });
});
