/**
 * OP15-024 Usopp (Character, Green, cost 4, 5000, Counter +1000, {Straw Hat Crew}).
 *
 * Card text: "[Opponent's Turn] This Character cannot be rested by your opponent's Leader and
 * Character effects and gains [Blocker]. [On K.O.] Rest up to 1 of your opponent's Leader or
 * Character cards with a cost of 7 or less."
 *
 * Rules: CR 10-1-4 ([Blocker]), "cannot be rested" (rules-digest 57: blocks resting by the
 * restricted effect sources only, here the opponent's Leader and Character effects; resting it
 * as the cost of the owner's own [Blocker] is not one of them), CR 10-2-17 ([On K.O.]).
 * The Leader as a target of the cost-7 filter is not asserted (a Leader has no cost).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passBlock, passCounter } from './kit-op15a.ts';
import {
  at,
  chr,
  kind,
  kw,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  payDonStrict,
  pickInst,
  playRaw,
  SCN,
  theirs,
  trash,
  yes,
} from './kit-op15a.ts';

const USOPP = 'OP15-024';
/** EB05-012 Camie: Green Character, cost 3, 0 power. [On Play] Rest up to 1 of your opponent's Characters with a cost of 6 or less. */
const CAMIE = 'EB05-012';
/** OP17-038: Green Event, cost 0. [Main] You may rest 4 of your cards: Rest up to 1 of your opponent's Characters. */
const REST_EVENT = 'OP17-038';

describe("OP15-024 Usopp: [Opponent's Turn] [Blocker] and cannot be rested by Character effects", () => {
  it("on the opponent's turn it has [Blocker]; on my own turn it does not", () => {
    const theirTurnGame = theirs(LD15.luffy, { characters: [USOPP] });
    expect(kw(theirTurnGame, at(theirTurnGame, 'p1', 'characters', USOPP))).toContain('Blocker');
    const myTurnGame = mine(LD15.luffy, { characters: [USOPP] });
    expect(kw(myTurnGame, at(myTurnGame, 'p1', 'characters', USOPP))).not.toContain('Blocker');
  });

  it('it can block an attack on my Leader (resting itself is not an opposing effect) and is rested by it', () => {
    const g = theirs(LD15.luffy, { characters: [USOPP] }, { characters: [SCN.c3] });
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', USOPP)]);
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', USOPP) });
    expect(g.card(at(g, 'p1', 'characters', USOPP)).rested).toBe(true);
  });

  it('an opposing Character effect (Camie, cost 6 or less) rests another Character of mine but not Usopp', () => {
    const g = theirs(LD15.luffy, { characters: [USOPP, SCN.c3] }, { hand: [CAMIE] });
    playRaw(g, CAMIE);
    need(g, 'choose', 'p2');
    expect(offeredIds(g)).toContain(SCN.c3);
    pickInst(g, [at(g, 'p1', 'characters', SCN.c3)]);
    expect(g.card(at(g, 'p1', 'characters', SCN.c3)).rested).toBe(true);
    expect(g.card(at(g, 'p1', 'characters', USOPP)).rested).toBe(false);
  });

  it('choosing Usopp as the target of that Character effect does not rest it (it may be chosen, the rest just does not happen)', () => {
    const g = theirs(LD15.luffy, { characters: [USOPP] }, { hand: [CAMIE] });
    playRaw(g, CAMIE);
    if (kind(g) === 'choose') {
      const u = at(g, 'p1', 'characters', USOPP);
      if (offeredIds(g).includes(USOPP)) pickInst(g, [u]);
      else none(g);
    }
    need(g, 'main', 'p2');
    expect(g.card(at(g, 'p1', 'characters', USOPP)).rested).toBe(false);
  });

  // Disagreement A-2: the text says "Leader and Character effects"; an Event effect is neither, so
  // an opposing Event can rest it. The engine does not rest it.
  it.fails(
    'the restriction names Leader and Character effects only: an opposing Event may rest it',
    () => {
      const g = theirs(LD15.luffy, { characters: [USOPP] }, { hand: [REST_EVENT] });
      playRaw(g, REST_EVENT);
      yes(g, 'p2');
      payDonStrict(g, 4);
      need(g, 'choose', 'p2');
      expect(offeredIds(g)).toEqual([USOPP]);
      pickInst(g, [at(g, 'p1', 'characters', USOPP)]);
      expect(g.card(at(g, 'p1', 'characters', USOPP)).rested).toBe(true);
    },
  );
});

/** p2 attacks the rested Usopp (5000 on their turn) with a 7000 Character, K.O.ing it. */
function koUsopp(p2chars: string[]) {
  const g = theirs(
    LD15.luffy,
    { characters: [{ card: USOPP, rested: true }] },
    { characters: [SCN.c5, ...p2chars] },
  );
  attack(g, at(g, 'p2', 'characters', SCN.c5), at(g, 'p1', 'characters', USOPP));
  passBlock(g);
  passCounter(g);
  return g;
}

describe('OP15-024 Usopp: [On K.O.] rest up to 1 Leader or Character with a cost of 7 or less', () => {
  it('offers the opposing Characters with cost 7 or less, not those with cost 8', () => {
    const g = koUsopp([SCN.c3, SCN.c6, SCN.c7, SCN.c8]);
    need(g, 'choose', 'p1');
    const ids = offeredIds(g);
    expect(ids).toContain(SCN.c3);
    expect(ids).toContain(SCN.c6);
    expect(ids).toContain(SCN.c7);
    expect(ids).not.toContain(SCN.c8);
  });

  it('rests the chosen Character', () => {
    const g = koUsopp([SCN.c3]);
    pickInst(g, [chr(g, 'p2', SCN.c3)]);
    expect(g.card(chr(g, 'p2', SCN.c3)).rested).toBe(true);
    expect(trash(g)).toEqual([USOPP]);
  });

  it('"up to 1": choosing nothing rests nothing', () => {
    const g = koUsopp([SCN.c3]);
    none(g);
    expect(g.card(chr(g, 'p2', SCN.c3)).rested).toBe(false);
  });
});
