/**
 * OP04-096 Corrida Coliseum (Stage, Black, cost 1, {Dressrosa}).
 *
 * Card text: "If your Leader has the [Dressrosa] type, your [Dressrosa] type Characters can attack
 * Characters on the turn in which they are played."
 *
 * Rules: a permanent effect of a Stage on my field (CR 8-1-3-3). It needs MY Leader to have the
 * {Dressrosa} type and gives {Dressrosa} Characters of mine the ability to attack Characters (never
 * the Leader) the turn they are played (CR 3-7-4 summoning sickness otherwise). It does nothing for
 * other types, for the opponent's cards, or once the Stage is gone.
 */
import { describe, expect, it } from 'vitest';
import { C29, canHit, ids29, inst, kind, L29, mine, need, playRaw, theirs } from './kit-st29a.ts';

const ID = 'OP04-096';
const BELLAMY = C29.bellamy; // OP01-076: Blue, cost 2, 4000, {Dressrosa}
const GILLY = C29.gilly; // OP10-054: Blue, cost 3, 5000, {Dressrosa}
const STAGE2 = 'OP05-021'; // Revolutionary Army HQ: Red Stage, cost 1
const SABO13 = 'ST13-001'; // Red/Yellow Leader, {Revolutionary Army}/{Dressrosa}
const TARGET = { card: C29.c3, rested: true };

/** p1's Main Phase: Dressrosa Leader unless given; the Stage on board; Bellamy just played. */
function board(o: { leader?: string; stage?: boolean; chars?: unknown[] } = {}) {
  return mine(
    o.leader ?? L29.dressrosa,
    {
      stage: o.stage === false ? undefined : ID,
      characters: (o.chars as never) ?? [{ card: BELLAMY, playedThisTurn: true }],
    },
    { characters: [TARGET] },
  );
}

const target = (g: ReturnType<typeof board>) => inst(g, 'p2', 'characters', C29.c3);

describe('OP04-096 Corrida Coliseum: Dressrosa Characters can attack Characters the turn they are played', () => {
  it('printed values: Stage, cost 1', () => {
    const g = mine(L29.dressrosa, { hand: [ID] });
    expect(g.card(inst(g, 'p1', 'hand', ID)).cost).toBe(1);
  });

  it('with a {Dressrosa} Leader, a {Dressrosa} Character played this turn can attack a (rested) Character', () => {
    const g = board();
    expect(canHit(g, inst(g, 'p1', 'characters', BELLAMY), target(g))).toBe(true);
  });

  it('but never the Leader: the turn it is played it still cannot attack the Leader', () => {
    const g = board();
    expect(canHit(g, inst(g, 'p1', 'characters', BELLAMY), g.leader('p2'))).toBe(false);
  });

  it('control: without the Stage the same Character cannot attack at all', () => {
    const g = board({ stage: false });
    expect(canHit(g, inst(g, 'p1', 'characters', BELLAMY), target(g))).toBe(false);
  });

  it('with a Leader that is NOT {Dressrosa} the Stage does nothing', () => {
    const g = board({ leader: L29.croc });
    expect(canHit(g, inst(g, 'p1', 'characters', BELLAMY), target(g))).toBe(false);
  });

  it('another {Dressrosa} Leader (a multi-type one) also enables it', () => {
    const g = board({ leader: SABO13 });
    expect(canHit(g, inst(g, 'p1', 'characters', BELLAMY), target(g))).toBe(true);
  });

  it('a Character without the {Dressrosa} type gets nothing', () => {
    const g = board({ chars: [{ card: C29.c4, playedThisTurn: true }] });
    expect(canHit(g, inst(g, 'p1', 'characters', C29.c4), target(g))).toBe(false);
  });

  it('it works for each {Dressrosa} Character separately', () => {
    const g = board({
      chars: [
        { card: BELLAMY, playedThisTurn: true },
        { card: GILLY, playedThisTurn: true },
      ],
    });
    expect(canHit(g, inst(g, 'p1', 'characters', BELLAMY), target(g))).toBe(true);
    expect(canHit(g, inst(g, 'p1', 'characters', GILLY), target(g))).toBe(true);
  });

  it('playing the Stage and then the Character in the same turn gives the same result', () => {
    const g = mine(L29.dressrosa, { hand: [ID, BELLAMY] }, { characters: [TARGET] });
    playRaw(g, ID);
    playRaw(g, BELLAMY);
    expect(kind(g)).toBe('main');
    expect(canHit(g, inst(g, 'p1', 'characters', BELLAMY), target(g))).toBe(true);
  });

  it('the opponent gets nothing from my Stage: their {Dressrosa} Character played this turn cannot attack', () => {
    const g = theirs(
      L29.croc,
      { stage: ID, characters: [{ card: C29.c3, rested: true }] },
      { characters: [{ card: BELLAMY, playedThisTurn: true }] },
    );
    need(g, 'main', 'p2');
    expect(
      canHit(g, inst(g, 'p2', 'characters', BELLAMY), inst(g, 'p1', 'characters', C29.c3)),
    ).toBe(false);
  });

  it('once another Stage replaces it, the permission is gone', () => {
    const g = mine(
      L29.dressrosa,
      { stage: ID, hand: [STAGE2], characters: [{ card: BELLAMY, playedThisTurn: true }] },
      { characters: [TARGET] },
    );
    expect(canHit(g, inst(g, 'p1', 'characters', BELLAMY), target(g))).toBe(true);
    playRaw(g, STAGE2);
    expect(ids29(g, 'p1', 'trash')).toEqual([ID]);
    expect(canHit(g, inst(g, 'p1', 'characters', BELLAMY), target(g))).toBe(false);
  });
});
