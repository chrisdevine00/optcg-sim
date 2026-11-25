/** OP09-108 Bartholomew Kuma. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  handIds,
  idsOf,
  OTHER_LEADER,
  passBlock,
  PLAIN_BLUE,
  RA_LEADER,
  rep,
  V,
} from './helpers-a09g3.ts';

const ID = 'OP09-108';

describe('OP09-108 Kuma [Trigger]', () => {
  /** p2 attacks p1's Leader; p1's top Life card is Kuma and is taken as damage. */
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

  it('has no keyword and no on-field ability', () => {
    const g = game({ leader: RA_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toEqual([]);
  });

  it('with a {Revolutionary Army} Leader and a total of 5 Life cards left (boundary), it is played', () => {
    const g = hit(RA_LEADER, 2, 4); // 1 + 4
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('with a total of 6 it is not played: it is trashed', () => {
    const g = hit(RA_LEADER, 2, 5);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('must not be played without a {Revolutionary Army} Leader', () => {
    const g = hit(OTHER_LEADER, 2, 2);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('declining the [Trigger] adds the card to the hand', () => {
    const g = game(
      { leader: RA_LEADER, life: [ID, V.c1] },
      { leader: PLAIN_BLUE, characters: [V.c7], life: [V.c1] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    g.act({ type: 'trigger', activate: false });
    expect(handIds(g, 'p1')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });
});
