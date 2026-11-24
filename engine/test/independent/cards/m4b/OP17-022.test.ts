/**
 * OP17-022 Shanks (Character, Green, cost 10, 12000, no Counter; The Four Emperors / Red-Haired
 * Pirates).
 *
 * Card text (cards/data):
 *   "[Rush] (This card can attack on the turn in which it is played.)
 *    [On Play] Set up to 2 of your DON!! cards as active. Then, rest all of your opponent's
 *    Characters."
 *
 * Rules: [Rush] (CR 10-1-1); only rested DON!! can be set active; "all of your opponent's
 * Characters" is every Character including ones already rested, and excludes the Leader; a rested
 * Character cannot activate [Blocker] and rested Characters become legal attack targets (CR 7-1-1-2).
 */
import { takeMost } from '../../helpers.ts';
import { describe, expect, it } from 'vitest';
import {
  act,
  attackers,
  blockers,
  canAttackAny,
  CH,
  donOf,
  F,
  LB,
  myTurn,
  play,
  side,
  sortedIds,
} from './kit-b.ts';

const SHANKS = 'OP17-022';

function game() {
  const g = myTurn(
    side(LB.greenKid, F.green, {
      hand: [SHANKS],
      costArea: { active: 10, rested: 0 },
      characters: [CH.alvida],
    }),
    side(LB.opp, F.red, {
      characters: [CH.blockerFranky, CH.marco, { card: CH.sai, rested: true }],
    }),
  );
  play(g, g.find('p1', 'hand', SHANKS));
  takeMost(g);
  return g;
}

describe('OP17-022 Shanks [On Play]: set up to 2 DON!! active, then rest all of the opponent’s Characters', () => {
  it('sets 2 of the 10 rested DON!! active (the card cost all 10)', () => {
    const g = game();
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 8 });
  });

  it('every opponent Character is rested: the active ones and the one that already was', () => {
    const g = game();
    for (const c of [CH.blockerFranky, CH.marco, CH.sai]) {
      expect(g.card(g.find('p2', 'characters', c)).rested).toBe(true);
    }
  });

  it('the opponent’s Leader is not a Character: it stays active', () => {
    const g = game();
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });

  it('your own Characters and Leader are not rested', () => {
    const g = game();
    expect(g.card(g.find('p1', 'characters', CH.alvida)).rested).toBe(false);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('the rested [Blocker] can no longer block an attack', () => {
    const g = game();
    act(g, {
      type: 'attack',
      attacker: g.find('p1', 'characters', CH.alvida),
      target: g.leader('p2'),
    });
    expect(blockers(g)).toEqual([]);
  });

  it('no opponent Characters: the DON!! are still set active and nothing breaks', () => {
    const g = myTurn(
      side(LB.greenKid, F.green, { hand: [SHANKS], costArea: { active: 10, rested: 0 } }),
      side(LB.opp, F.red),
    );
    play(g, g.find('p1', 'hand', SHANKS));
    takeMost(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([SHANKS]);
  });
});

describe('OP17-022 Shanks [Rush]', () => {
  it('Shanks can attack the turn it is played: the opponent’s Leader, and now also the rested Characters', () => {
    const g = game();
    const shanks = g.find('p1', 'characters', SHANKS);
    expect(g.card(shanks).keywords).toContain('Rush');
    expect(canAttackAny(g, shanks)).toBe(true);
    expect(attackers(g)).toContain(shanks);
    const targets = g
      .legal()
      .flatMap((a) => (a.type === 'attack' && a.attacker === shanks ? [a.target] : []));
    expect(targets).toContain(g.leader('p2'));
    expect(targets).toContain(g.find('p2', 'characters', CH.marco));
    expect(g.power(shanks)).toBe(12000);
  });
});
