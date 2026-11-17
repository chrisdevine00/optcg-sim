/** ST17-004 Boa Hancock. QA-OP17 OP17-050 (same "top or bottom in any order" wording). */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import {
  BLUE,
  don,
  expectDecision,
  game,
  option,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { HANCOCK, orderAll, ROSI, WARLORD } from './helpers-hancock-rosi.ts';

describe('ST17-004 Boa Hancock', () => {
  const start = (leader: string, chars: string[] = [WARLORD, V.c1]) => {
    const g = game(
      {
        leader,
        hand: ['ST17-004'],
        characters: chars,
        deck: [V.c1, V.c2, V.c3, BLUE, PURPLE],
        costArea: { active: 4, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'ST17-004');
    return g;
  };

  it('has [Blocker]', () => {
    const g = start(HANCOCK);
    expect(g.card(g.find('p1', 'characters', 'ST17-004')).keywords).toContain('Blocker');
  });

  it('[On Play] the controller sees 3 cards and places all of them on top in a chosen order', () => {
    const g = start(HANCOCK);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['top', 'bottom']);
    const v1 = project(g.state, 'p1') as unknown as { looking: { card: string }[] };
    expect(v1.looking.map((c) => c.card).sort()).toEqual([V.c1, V.c2, V.c3].sort());
    const v2 = project(g.state, 'p2') as unknown as { looking: unknown[] };
    expect(v2.looking).toEqual([]);
    option(g, 'top');
    orderAll(g);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
    expect(
      g
        .zone('p1', 'deck')
        .slice(0, 3)
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c1, V.c2, V.c3].sort());
  });

  it('all 3 can go to the bottom instead', () => {
    const g = start(HANCOCK);
    option(g, 'bottom');
    orderAll(g);
    expect(
      g
        .zone('p1', 'deck')
        .map((c) => c.card)
        .slice(0, 2),
    ).toEqual([BLUE, PURPLE]);
  });

  it('then gives up to 1 rested DON!! to a Warlord Leader or Character of your choice', () => {
    const g = start(HANCOCK);
    option(g, 'top');
    orderAll(g);
    // The Leader, the new Hancock and the Warlord Character qualify; the other Character does not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.find('p1', 'characters', WARLORD)]);
    expect(g.card(g.find('p1', 'characters', WARLORD)).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 3, active: 0 });
  });

  it('works with a Leader that is not a Warlord, giving to a Warlord Character', () => {
    const g = start(ROSI);
    option(g, 'bottom');
    orderAll(g);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'characters', 'ST17-004')]);
    expect(g.card(g.find('p1', 'characters', 'ST17-004')).don).toBe(1);
  });
});
