/** EB05-051 Ahiru: [On Play] Rest up to 1 of your opponent's Characters with a cost equal to or less than the total of your and your opponent's Life cards. [Trigger] Play this card. */
import { describe, expect, it } from 'vitest';
import { BLUE, game, none, pick, play, PLAIN_PURPLE, PURPLE, times, V } from './helpers.ts';
import { triggerHit } from './helpers-robin.ts';

const AHIRU = 'EB05-051';

describe('EB05-051 Ahiru', () => {
  const setup = (myLife: number, oppLife: number, opp: string[]) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: [AHIRU],
        life: times(myLife, BLUE),
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_PURPLE, life: times(oppLife, PURPLE), characters: opp },
    );

  it('[On Play] rests a Character with a cost up to the total of both Life counts', () => {
    const g = setup(3, 3, [V.c6, V.c7]);
    play(g, AHIRU);
    // 3 + 3 = 6: the cost 7 Character is not a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(false);
  });

  it('[On Play] the total shrinks with the Life cards (1 + 2 = 3: cost 3 yes, cost 4 no)', () => {
    const g = setup(1, 2, [V.c3, V.c4]);
    play(g, AHIRU);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
  });

  it('[On Play] "up to 1": may rest nothing', () => {
    const g = setup(3, 3, [V.c1]);
    play(g, AHIRU);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('[On Play] with 0 Life cards each no Character is a candidate (cost 1 > 0)', () => {
    const g = setup(0, 0, [V.c1]);
    play(g, AHIRU);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('[Trigger] plays this card', () => {
    const g = triggerHit(AHIRU);
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([AHIRU]);
  });
});
