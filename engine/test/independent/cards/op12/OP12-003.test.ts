/**
 * OP12-003 Crocus (Character, Red, cost 2, 3000, Counter +1000, {Former Roger Pirates}).
 *
 * Card text: "[On K.O.] You may reveal 2 Events from your hand: Play up to 1 red Character card with
 * 3000 power or less from your hand."
 *
 * Rules: [On K.O.] fires when this Character is K.O.'d, by battle or by an effect (CR 10-2-?; a
 * removal that is not a K.O. does not fire it, and the 6th-Character trash is rule processing, not
 * a K.O.: rules-digest 78). The reveal is an optional cost; revealed cards stay in the hand. "Up to
 * 1" may be 0. Played Characters from hand enter active. An optional cost paid from the hidden hand
 * is offered even when unpayable, with accept illegal (engine convention, DECISIONS 2026-10-29).
 * Boundary checks use the printed power of the hand card (not base power of a modified card: cards
 * in hand have none).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  canAcceptOptional,
  chr,
  decision,
  kind,
  LD12,
  need,
  none,
  offeredCardIds,
  opponentKingdomCome,
  pickInst,
  playRaw,
  revealCost,
  revealedByEffects,
  S12,
  side,
  sorted,
  theirTurn,
  yes,
  no,
  act,
} from './kit-op12a.ts';

const CRO = 'OP12-003';
const E = S12.event;

/** p2's Main Phase: p1 has a rested Crocus (3000) and `hand`; p2's Leader (5000) can attack it. */
function theirs12(hand: string[], p1Chars: (string | { card: string; rested?: boolean })[] = []) {
  return theirTurn(
    side(LD12.luffy, S12.mohji, {
      hand,
      characters: [{ card: CRO, rested: true }, ...p1Chars],
      costArea: { active: 0, rested: 0 },
    }),
    side(LD12.luffy, S12.sunny, { costArea: { active: 10, rested: 0 } }),
  );
}

/** p2's Leader K.O.s the rested Crocus in battle; stops at the first decision p1 owes after the K.O. */
function koInBattle(g: ReturnType<typeof theirs12>): void {
  act(g, { type: 'attack', attacker: g.leader('p2'), target: chr(g, 'p1', CRO) });
  act(g, { type: 'block', blocker: null });
  act(g, { type: 'endCounter' });
}

describe('OP12-003 Crocus: [On K.O.] reveal 2 Events, play a red Character with 3000 power or less', () => {
  it('printed values: cost 2, 3000 power, Counter +1000', () => {
    const g = theirs12([]);
    const c = g.card(chr(g, 'p1', CRO));
    expect([c.cost, c.power, c.counter]).toEqual([2, 3000, 1000]);
  });

  it('K.O.d in battle with 2 Events in hand: the reveal is offered, then the playable red Characters (3000 or less) are offered', () => {
    const g = theirs12([E, E, S12.sunny, S12.sai, S12.mohji, S12.komachiyo]);
    koInBattle(g);
    expect(sorted(g, 'p1', 'trash')).toEqual([CRO]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    revealCost(g, 2);
    need(g, 'choose', 'p1');
    // 3000 passes, 4000 (Sai) fails, a blue 3000 (Mohji) fails
    expect(offeredCardIds(g)).toEqual([S12.komachiyo, S12.sunny].sort());
    expect(revealedByEffects(g)).toEqual([E, E]);
  });

  it('plays the chosen Character from hand, active, and the Events stay in hand', () => {
    const g = theirs12([E, E, S12.sunny]);
    koInBattle(g);
    yes(g, 'p1');
    revealCost(g, 2);
    pickInst(g, [g.find('p1', 'hand', S12.sunny)]);
    expect(sorted(g, 'p1', 'characters')).toEqual([S12.sunny]);
    expect(g.card(chr(g, 'p1', S12.sunny)).rested).toBe(false);
    expect(sorted(g, 'p1', 'hand')).toEqual([E, E]);
  });

  it('"up to 1": choosing nothing pays the reveal and plays nothing', () => {
    const g = theirs12([E, E, S12.sunny]);
    koInBattle(g);
    yes(g, 'p1');
    revealCost(g, 2);
    none(g);
    expect(sorted(g, 'p1', 'characters')).toEqual([]);
    expect(sorted(g, 'p1', 'hand')).toEqual([E, E, S12.sunny].sort());
  });

  it('declining the optional cost plays nothing and reveals nothing', () => {
    const g = theirs12([E, E, S12.sunny]);
    koInBattle(g);
    no(g, 'p1');
    expect(sorted(g, 'p1', 'characters')).toEqual([]);
    expect(revealedByEffects(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('with only 1 Event in hand the cost cannot be paid: accept is not available and nothing is played', () => {
    const g = theirs12([E, S12.sunny, S12.mohji]);
    koInBattle(g);
    const d = decision(g);
    if (d?.kind === 'optional') {
      expect(canAcceptOptional(g)).toBe(false);
      no(g, 'p1');
    }
    expect(sorted(g, 'p1', 'characters')).toEqual([]);
    expect(sorted(g, 'p1', 'hand')).toEqual([E, S12.mohji, S12.sunny].sort());
  });

  it('with Events but no red Character of 3000 or less: the effect finds nothing to play', () => {
    const g = theirs12([E, E, S12.sai, S12.mohji]);
    koInBattle(g);
    yes(g, 'p1');
    revealCost(g, 2);
    if (kind(g) === 'choose') {
      expect(offeredCardIds(g)).toEqual([]);
      none(g);
    }
    expect(sorted(g, 'p1', 'characters')).toEqual([]);
  });

  it('K.O.d by an opponent effect (Kingdom Come) triggers it as well', () => {
    const g2 = theirTurn(
      side(LD12.luffy, S12.mohji, {
        hand: [E, E, S12.sunny],
        characters: [{ card: CRO, rested: true }],
        costArea: { active: 0, rested: 0 },
      }),
      side(LD12.luffy, S12.sunny, {
        hand: [S12.kingdomCome],
        costArea: { active: 10, rested: 0 },
      }),
    );
    opponentKingdomCome(g2, chr(g2, 'p1', CRO));
    need(g2, 'optional', 'p1');
    yes(g2, 'p1');
    revealCost(g2, 2);
    pickInst(g2, [g2.find('p1', 'hand', S12.sunny)]);
    expect(sorted(g2, 'p1', 'characters')).toEqual([S12.sunny]);
    expect(sorted(g2, 'p1', 'trash')).toEqual([CRO]);
  });

  it('must not: when another Character blocks and Crocus survives, nothing is asked', () => {
    const g = theirs12([E, E, S12.sunny], [S12.killer]);
    act(g, { type: 'attack', attacker: g.leader('p2'), target: chr(g, 'p1', CRO) });
    act(g, { type: 'block', blocker: chr(g, 'p1', S12.killer) });
    act(g, { type: 'endCounter' });
    expect(kind(g)).toBe('main');
    expect(sorted(g, 'p1', 'characters')).toContain(CRO);
    expect(sorted(g, 'p1', 'hand')).toEqual([E, E, S12.sunny].sort());
  });

  it('must not: the 6th-Character trash is not a K.O., so the effect stays silent', () => {
    const g = theirTurn(
      side(LD12.luffy, S12.mohji, {
        hand: [E, E, S12.sunny, S12.sai],
        characters: [CRO, S12.mohji, S12.mohji, S12.mohji, S12.mohji],
        costArea: { active: 10, rested: 0 },
      }),
      side(LD12.luffy, S12.sunny, {}),
    );
    // it is p2's turn; give the turn to p1 by ending p2's turn
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    playRaw(g, S12.sai);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', CRO)]);
    expect(sorted(g, 'p1', 'trash')).toEqual([CRO]);
    expect(kind(g)).toBe('main');
    expect(at(g, 'p1', 'characters', S12.sai)).toBeDefined();
  });
});
