/** EB03-006 Nami. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  game,
  hand,
  none,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import {
  activate,
  ALABASTA_LEADER,
  atMain,
  canAccept,
  offeredAb,
  pickableCardIds,
} from './helpers-w7c1.ts';

const ID = 'EB03-006';

describe('EB03-006 Nami', () => {
  const mk = (p1: object = {}, p2: object = {}) =>
    game(
      {
        leader: ALABASTA_LEADER,
        hand: [ID],
        costArea: { active: 5, rested: 0 },
        ...p1,
      },
      { leader: PLAIN_BLUE, characters: [V.c3, V.c1], ...p2 },
    );
  const play = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

  it('[On Play]: you may give your active Leader -5000 power during this turn: draw 1 card', () => {
    const g = mk();
    const before = hand(g, 'p1').length;
    play(g);
    expect(dec(g)?.kind).toBe('optional');
    accept(g);
    expect(g.power(g.leader('p1'))).toBe(0);
    expect(hand(g, 'p1')).toHaveLength(before - 1 + 1);
    expect(atMain(g)).toBe(true);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('the power loss ends with the turn', () => {
    const g = mk();
    play(g);
    accept(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining the optional cost: no draw and no power change', () => {
    const g = mk();
    const before = hand(g, 'p1').length;
    play(g);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g, 'p1')).toHaveLength(before - 1);
  });

  it('must not be offered with a rested Leader (it is not an active Leader)', () => {
    const g = mk({ leader: { card: ALABASTA_LEADER, rested: true } });
    const before = hand(g, 'p1').length;
    play(g);
    expect(canAccept(g)).toBe(false);
    expect(atMain(g)).toBe(true);
    expect(hand(g, 'p1')).toHaveLength(before - 1);
  });

  it('[Activate: Main] [Once Per Turn]: with an {Alabasta} Leader, up to 1 opponent Character gets -1000 power', () => {
    const g = mk({ hand: [], characters: [ID] });
    const nami = g.find('p1', 'characters', ID);
    expect(offeredAb(g, nami, 'activate')).toBe(true);
    activate(g, nami, 'activate');
    expect(pickableCardIds(g).sort()).toEqual([V.c1, V.c3].sort());
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
    // Once per turn.
    expect(offeredAb(g, nami, 'activate')).toBe(false);
  });

  it('"up to 1": no target is allowed, and the once per turn is spent', () => {
    const g = mk({ hand: [], characters: [ID] });
    const nami = g.find('p1', 'characters', ID);
    activate(g, nami, 'activate');
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    expect(offeredAb(g, nami, 'activate')).toBe(false);
  });

  it('a Leader without the {Alabasta} type: the effect is a failed "If": activated, once per turn spent, nothing happens', () => {
    const g = mk({ hand: [], characters: [ID], leader: PLAIN_PURPLE });
    const nami = g.find('p1', 'characters', ID);
    expect(offeredAb(g, nami, 'activate')).toBe(true);
    activate(g, nami, 'activate');
    expect(atMain(g)).toBe(true);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    expect(offeredAb(g, nami, 'activate')).toBe(false);
  });
});
