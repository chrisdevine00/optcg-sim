/** OP17-012 Blenheim. */
import { describe, expect, it } from 'vitest';
import {
  dec,
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  PLAIN_BLUE,
  takeDamage,
  V,
} from './helpers.ts';
import { ATMOS, DOMA, RED_LEADER, WB_EVENT } from './helpers-op17g1.ts';

const ID = 'OP17-012';

describe('OP17-012 Blenheim', () => {
  /** p2's 6000 Character attacks; Blenheim blocks, is K.O.d, and p1 owes the [On K.O.] choice. */
  const koed = (handCards: string[]) => {
    const g = game(
      { leader: RED_LEADER, hand: handCards, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c4] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
    endCounter(g);
    return g;
  };

  it('[Blocker]: can block (it is listed as a keyword)', () => {
    const g = game(
      { leader: RED_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c4] },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(true);
    passBlock(g);
  });

  it('[On K.O.] plays up to 1 card with a cost of 1 and a "Whitebeard Pirates" type from your hand', () => {
    const g = koed([DOMA]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    pick(g, [g.find('p1', 'hand', DOMA)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([DOMA]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('a cost-4 Whitebeard Character and a cost-1 Event are not candidates', () => {
    const g = koed([ATMOS, WB_EVENT, V.c1]);
    // No pick is offered (an empty "up to" choice may still be open).
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    if (dec(g)?.kind === 'choose') none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('"up to 1": it may play nothing, and only one of two candidates is played', () => {
    const g = koed([DOMA, DOMA]);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    const g2 = koed([DOMA, DOMA]);
    pick(g2, [g2.find('p1', 'hand', DOMA, 0)]);
    expect(g2.zone('p1', 'characters')).toHaveLength(1);
  });

  it('does not trigger when Blenheim leaves the field without being K.O.d (a blocked attacker it survives)', () => {
    const g = game(
      { leader: RED_LEADER, hand: [DOMA], characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c1] },
      { turn: 4, activePlayer: 'p2' },
    );
    // A 3000 attacker against Blenheim's 1000 would K.O. it, so use the Leader attack unblocked instead.
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c1), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(DOMA);
  });
});
