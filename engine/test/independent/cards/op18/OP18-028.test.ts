/**
 * OP18-028 Chimney (Green Character, cost 2, 0 power, {Water Seven}).
 *
 * Card text (cards/data):
 *   "[Activate: Main] You may rest 1 of your [Gonbe] and this Character: Set your [Monkey.D.Luffy]
 *    Leader as active."
 *
 * Reading: the cost rests one of your Characters named [Gonbe] (OP18-025) AND Chimney herself (both
 * must be active); the effect sets your Leader active if it is named [Monkey.D.Luffy].
 *
 * Scenery: ST01-001 Luffy (Leader named Monkey.D.Luffy), ST02-001 Kid (not Luffy), OP18-035 Michael
 * & Hoichael ({Water Seven}, not Gonbe).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  at,
  atMain,
  canActivate,
  endBattle,
  LC,
  mine,
  need,
  pickCards,
  pickInst,
  toMyNextMain,
  useAbility,
  VC,
  type Chars,
} from './kit-c.ts';

const CHIMNEY = 'OP18-028';
const GONBE = 'OP18-025';

/** The Leader attacks first, so it is rested; then the ability is started. */
function board(leader: string, chars: Chars) {
  const g = mine(leader, { characters: chars });
  attack(g, g.leader('p1'), g.leader('p2'));
  endBattle(g);
  return g;
}

function start(g: ReturnType<typeof mine>) {
  useAbility(g, at(g, 'p1', 'characters', CHIMNEY));
}

describe('OP18-028 Chimney: [Activate: Main] rest [Gonbe] and this Character: set your [Monkey.D.Luffy] Leader active', () => {
  it('rests Gonbe and Chimney and sets the rested Luffy Leader active', () => {
    const g = board(LC.luffy, [CHIMNEY, GONBE]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    start(g);
    if (g.legal().some((a) => a.type === 'pick')) pickCards(g, [GONBE]);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', GONBE)).rested).toBe(true);
    expect(g.card(at(g, 'p1', 'characters', CHIMNEY)).rested).toBe(true);
  });

  it('works for the OP18-022 Luffy Leader too (same name)', () => {
    const g = board(LC.luffyGreen, [CHIMNEY, GONBE]);
    start(g);
    if (g.legal().some((a) => a.type === 'pick')) pickCards(g, [GONBE]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('needs a [Gonbe]: another {Water Seven} Character cannot pay', () => {
    const g = board(LC.luffy, [CHIMNEY, VC.michael3]);
    expect(canActivate(g, at(g, 'p1', 'characters', CHIMNEY))).toBe(false);
  });

  it('needs Chimney herself to be active: a rested Chimney cannot activate', () => {
    const g = board(LC.luffy, [{ card: CHIMNEY, rested: true }, GONBE]);
    expect(canActivate(g, at(g, 'p1', 'characters', CHIMNEY))).toBe(false);
  });

  it('needs an active Gonbe: a rested Gonbe cannot pay', () => {
    const g = board(LC.luffy, [CHIMNEY, { card: GONBE, rested: true }]);
    expect(canActivate(g, at(g, 'p1', 'characters', CHIMNEY))).toBe(false);
  });

  it('with two Gonbes only one is rested', () => {
    const g = board(LC.luffy, [CHIMNEY, GONBE, GONBE]);
    start(g);
    if (g.legal().some((a) => a.type === 'pick')) {
      need(g, 'choose', 'p1');
      pickInst(g, [at(g, 'p1', 'characters', GONBE, 0)]);
    }
    const rested = [0, 1].filter((i) => g.card(at(g, 'p1', 'characters', GONBE, i)).rested);
    expect(rested).toHaveLength(1);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('a Chimney played this turn can use it (resting is the cost; no summoning sickness for Activate)', () => {
    const g = mine(LC.luffy, { characters: [{ card: CHIMNEY, playedThisTurn: true }, GONBE] });
    expect(canActivate(g, at(g, 'p1', 'characters', CHIMNEY))).toBe(true);
  });

  it('the rested Chimney and Gonbe untap on the next turn (nothing is skipped)', () => {
    const g = board(LC.luffy, [CHIMNEY, GONBE]);
    start(g);
    if (g.legal().some((a) => a.type === 'pick')) pickCards(g, [GONBE]);
    toMyNextMain(g);
    expect(g.card(at(g, 'p1', 'characters', CHIMNEY)).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', GONBE)).rested).toBe(false);
  });

  it('a Leader not named [Monkey.D.Luffy] is not set active (Kid stays rested)', () => {
    const g = board(LC.kid, [CHIMNEY, GONBE]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    if (canActivate(g, at(g, 'p1', 'characters', CHIMNEY))) {
      start(g);
      if (g.legal().some((a) => a.type === 'pick')) pickCards(g, [GONBE]);
    }
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });
});
