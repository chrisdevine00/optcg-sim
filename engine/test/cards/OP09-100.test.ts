/** OP09-100 Karasu. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  idsOf,
  OTHER_LEADER,
  passBlock,
  PLAIN_BLUE,
  RA_LEADER,
  rep,
  V,
} from './helpers-a09g3.ts';

const ID = 'OP09-100';

describe('OP09-100 Karasu', () => {
  it('has [Blocker]', () => {
    const g = game({ leader: RA_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  describe('[Trigger]', () => {
    /** p2 attacks p1's Leader; p1's top Life card is Karasu and is taken as damage. */
    const hit = (leader: string, mine: number, theirs: number) => {
      const g = game(
        { leader, life: [ID, ...rep(mine - 1, V.c1)] },
        { leader: PLAIN_BLUE, characters: [V.c7], life: rep(theirs, V.c1) },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
      passBlock(g);
      endCounter(g);
      expectDecision(g, 'trigger', 'p1');
      g.act({ type: 'trigger', activate: true });
      return g;
    };

    it('with a {Revolutionary Army} Leader and a total of 5 Life cards left (boundary), it is played', () => {
      const g = hit(RA_LEADER, 3, 3); // 2 + 3
      expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    });

    it('with a total of 6 it is not played: it is trashed', () => {
      const g = hit(RA_LEADER, 3, 4);
      expect(idsOf(g, 'p1', 'characters')).toEqual([]);
      expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
    });

    it('a smaller total is fine (1 + 1)', () => {
      const g = hit(RA_LEADER, 2, 1);
      expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    });

    it('must not be played without a {Revolutionary Army} Leader', () => {
      const g = hit(OTHER_LEADER, 3, 3);
      expect(idsOf(g, 'p1', 'characters')).toEqual([]);
      expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
    });
  });
});
