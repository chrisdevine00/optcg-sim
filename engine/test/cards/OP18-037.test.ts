/** OP18-037 Yokozuna. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick } from './helpers.ts';
import { candidates, koBy, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';
import { OPP } from './helpers-a10g1.ts';

const ID = 'OP18-037';

describe('OP18-037 Yokozuna', () => {
  it('has [Blocker]', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("[On K.O.] rests up to 1 of the opponent's Leader, Characters or Stage", () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c3], stage: 'OP05-040' },
    );
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g).sort()).toEqual(
      [g.leader('p2'), g.find('p2', 'characters', V.c3), g.find('p2', 'stage', 'OP05-040')].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
  });

  it('can rest the opponent Leader', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ID] }, { leader: PLAIN_BLUE });
    koBy(g, 'p1', ID, 'p2');
    pick(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).rested).toBe(true);
  });

  it('"up to 1": may rest nothing', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    koBy(g, 'p1', ID, 'p2');
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it("also fires when it is K.O.'d on the opponent's turn", () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
      OPP,
    );
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'choose', 'p1');
  });
});
