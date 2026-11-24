/** OP14-068 Trebol. */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, expectDecision, payDon, PLAIN_BLUE } from './helpers.ts';
import { DP_LEADER, game, OTHER_LEADER, plant } from './helpers-op14g3.ts';

const ID = 'OP14-068';
const RETURN_OPP = { returnDon: { n: 1, player: 'opponent' } };

describe('OP14-068 Trebol', () => {
  /** p2's turn: p1 (Trebol, `leader`, 3 active DON!!) is about to have a DON!! returned by p2. */
  const start = (leader = DP_LEADER) =>
    game(
      { leader, characters: [ID], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );

  it("[Opponent's Turn] when your DON!! is returned: add up to 1 DON!! from the DON!! deck, rested", () => {
    const g = start();
    plant(g, 'p2', RETURN_OPP);
    expectDecision(g, 'choose', 'p1');
    payDon(g);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1, deck: 7 });
  });

  it('only once per turn: a second return adds nothing', () => {
    const g = start();
    plant(g, 'p2', RETURN_OPP);
    payDon(g);
    addMost(g);
    plant(g, 'p2', RETURN_OPP);
    payDon(g);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1, deck: 8 });
  });

  it('does not fire when your Leader is not {Donquixote Pirates}', () => {
    const g = start(OTHER_LEADER);
    plant(g, 'p2', RETURN_OPP);
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0, deck: 8 });
  });

  it('does not fire on your own turn (a DON!! -1 of your own)', () => {
    const g = game(
      { leader: DP_LEADER, characters: [ID], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    plant(g, 'p1', { returnDon: { n: 1 } });
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0, deck: 8 });
  });

  it('does not fire when the opponent returns their own DON!!', () => {
    const g = game(
      { leader: DP_LEADER, characters: [ID], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, costArea: { active: 2, rested: 0 } },
      { turn: 4, activePlayer: 'p2' },
    );
    plant(g, 'p2', { returnDon: { n: 1 } });
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
  });
});
