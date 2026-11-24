/**
 * OP11-014 Borsalino (Character, Red, cost 3, 3000, Counter +1000, {FILM}/{Navy}, [Blocker]).
 *
 * Card text: "[Blocker] [Activate: Main] You may rest this Character: Up to 1 of your "Navy" type
 * Leader or Character cards can also attack active Characters during this turn."
 *
 * Rules: only rested Characters can normally be attacked (CR 7-1-1-2); "also" adds active ones for
 * this turn without removing the usual targets (RL-17). It does not let a Character attack on the
 * turn it was played, and other attack restrictions still apply (QA-OP11 OP11-119, OP11-010).
 * Resting is the cost: a rested Character cannot pay it.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  canHit,
  chr,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  offeredAbilities,
  pickInst,
  theirs,
  toMyNextMain,
  useAbility,
  offeredIds,
} from './kit-op11a.ts';

const BORSA = 'OP11-014';

function board(
  leader: string = L11.koby,
  chars: (string | { card: string; rested?: boolean; playedThisTurn?: boolean })[] = [
    BORSA,
    N11.navy4,
    N11.fish3,
  ],
) {
  return mine(
    leader,
    { characters: chars },
    { characters: [N11.marco, { card: N11.sai, rested: true }] },
  );
}

function activate(g: ReturnType<typeof board>) {
  useAbility(g, at(g, 'p1', 'characters', BORSA));
  if (kind(g) === 'optional') g.act({ type: 'optional', accept: true, player: 'p1' });
  need(g, 'choose', 'p1');
}

describe('OP11-014 Borsalino: [Blocker] and [Activate: Main] rest: a Navy card can also attack active Characters', () => {
  it('printed values: cost 3, 3000, Counter +1000, [Blocker]', () => {
    const g = board();
    const b = chr(g, 'p1', BORSA);
    expect(g.card(b).cost).toBe(3);
    expect(g.power(b)).toBe(3000);
    expect(g.card(b).counter).toBe(1000);
    expect(g.card(b).keywords).toContain('Blocker');
  });

  it('[Blocker]: Borsalino can block an attack on my Leader', () => {
    const g = theirs(L11.koby, { characters: [BORSA] }, { characters: [N11.marco] });
    attack(g, chr(g, 'p2', N11.marco), g.leader('p1'));
    expect(blockers(g)).toEqual([chr(g, 'p1', BORSA)]);
  });

  it('a chosen Navy Character can then attack an ACTIVE opposing Character', () => {
    const g = board();
    expect(canHit(g, chr(g, 'p1', N11.navy4), chr(g, 'p2', N11.marco))).toBe(false);
    activate(g);
    pickInst(g, [chr(g, 'p1', N11.navy4)]);
    need(g, 'main', 'p1');
    expect(canHit(g, chr(g, 'p1', N11.navy4), chr(g, 'p2', N11.marco))).toBe(true);
  });

  it('a chosen Navy Leader can then attack an active opposing Character', () => {
    const g = board();
    activate(g);
    pickInst(g, [g.leader('p1')]);
    expect(canHit(g, g.leader('p1'), chr(g, 'p2', N11.marco))).toBe(true);
  });

  it('offers my Navy Leader and Navy Characters only', () => {
    const g = board();
    activate(g);
    expect(offeredIds(g)).toEqual([L11.koby, BORSA, N11.navy4].sort());
  });

  it('with a non-Navy Leader the Leader is not offered', () => {
    const g = board(L11.luffy);
    activate(g);
    expect(offeredIds(g)).toEqual([BORSA, N11.navy4].sort());
  });

  it('"up to 1": only the chosen card gains it; the other Navy card does not', () => {
    const g = board(L11.koby, [BORSA, N11.navy4, N11.navy3]);
    activate(g);
    pickInst(g, [chr(g, 'p1', N11.navy4)]);
    expect(canHit(g, chr(g, 'p1', N11.navy3), chr(g, 'p2', N11.marco))).toBe(false);
  });

  it('"also": the chosen card can still attack the Leader and rested Characters', () => {
    const g = board();
    activate(g);
    pickInst(g, [chr(g, 'p1', N11.navy4)]);
    expect(canHit(g, chr(g, 'p1', N11.navy4), g.leader('p2'))).toBe(true);
    expect(canHit(g, chr(g, 'p1', N11.navy4), chr(g, 'p2', N11.sai))).toBe(true);
  });

  it('does not let a Character attack on the turn it was played', () => {
    const g = board(L11.koby, [BORSA, { card: N11.navy4, playedThisTurn: true }]);
    activate(g);
    pickInst(g, [chr(g, 'p1', N11.navy4)]);
    expect(canHit(g, chr(g, 'p1', N11.navy4), chr(g, 'p2', N11.marco))).toBe(false);
    expect(canHit(g, chr(g, 'p1', N11.navy4), g.leader('p2'))).toBe(false);
  });

  it('Borsalino is rested as the cost and cannot be activated while rested', () => {
    const g = board();
    activate(g);
    none(g);
    expect(g.card(chr(g, 'p1', BORSA)).rested).toBe(true);
    expect(offeredAbilities(g, chr(g, 'p1', BORSA))).toEqual([]);
    const h = board(L11.koby, [{ card: BORSA, rested: true }, N11.navy4]);
    expect(offeredAbilities(h, chr(h, 'p1', BORSA))).toEqual([]);
  });

  it('the permission ends with the turn', () => {
    const g = board();
    activate(g);
    pickInst(g, [chr(g, 'p1', N11.navy4)]);
    toMyNextMain(g);
    expect(canHit(g, chr(g, 'p1', N11.navy4), chr(g, 'p2', N11.marco))).toBe(false);
  });
});
