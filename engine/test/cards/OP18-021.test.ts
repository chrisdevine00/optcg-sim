/** OP18-021 Franky (Leader). OP-18 wave G1 (Stage Counters). */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { candidates } from './helpers-a10g1.ts';
import { don, expectDecision, game, hand, none, pick, trash, V } from './helpers.ts';
import { FRANKY_L, PLAIN_BLUE, SHC2, STAGE3, STAGE5, STAGE6 } from './helpers-op18.ts';

const ID = FRANKY_L;
const ACT = (g: ReturnType<typeof game>) =>
  g.act({ type: 'activate', card: g.leader('p1'), ability: 'play-stage' });

describe('OP18-021 Franky', () => {
  it('Stage cards in your hand have a +3000 Counter; other cards keep their own', () => {
    const g = game({ leader: ID, hand: [STAGE3, STAGE6, SHC2] }, { leader: PLAIN_BLUE });
    const c = (id: string) => queries.card(g.state, g.find('p1', 'hand', id)).counter;
    expect(c(STAGE3)).toBe(3000);
    expect(c(STAGE6)).toBe(3000);
    expect(c(SHC2)).toBe(1000);
  });

  it("the opponent's Stages in hand get nothing", () => {
    const g = game({ leader: ID }, { leader: PLAIN_BLUE, hand: [STAGE3] });
    expect(queries.card(g.state, g.find('p2', 'hand', STAGE3)).counter).toBe(null);
  });

  it('a Stage is trashed as a Counter for +3000 during the battle', () => {
    const g = game(
      { leader: ID, hand: [STAGE3] },
      { leader: PLAIN_BLUE, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    expectDecision(g, 'counter', 'p1');
    g.act({ type: 'counter', card: g.find('p1', 'hand', STAGE3), target: g.leader('p1') });
    expect(trash(g, 'p1')).toEqual([STAGE3]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(3);
  });

  it('[Activate: Main] DON!! −1: plays a Stage with a cost of 5 or less from your hand', () => {
    const g = game(
      { leader: ID, hand: [STAGE5, STAGE6], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    ACT(g);
    expect(candidates(g)).toEqual([g.find('p1', 'hand', STAGE5)]);
    pick(g, [g.find('p1', 'hand', STAGE5)]);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([STAGE5]);
    expect(hand(g, 'p1')).toEqual([STAGE6]);
    expect(don(g, 'p1').deck).toBe(9);
    expect(don(g, 'p1').active).toBe(1); // the play is free
  });

  it('is up to 1: choosing none still pays the DON!! −1', () => {
    const g = game(
      { leader: ID, hand: [STAGE3], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    ACT(g);
    none(g);
    expect(g.zone('p1', 'stage')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(10);
  });

  it('Once Per Turn, and not without a DON!! to return', () => {
    const g = game(
      { leader: ID, hand: [STAGE3, STAGE5], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    ACT(g);
    pick(g, [g.find('p1', 'hand', STAGE3)]);
    const again = g.legal().some((a) => a.type === 'activate' && a.card === g.leader('p1'));
    expect(again).toBe(false);
    const empty = game({ leader: ID, hand: [STAGE3], donDeck: 10 }, { leader: PLAIN_BLUE });
    expect(empty.legal().some((a) => a.type === 'activate' && a.card === empty.leader('p1'))).toBe(
      false,
    );
  });
});
