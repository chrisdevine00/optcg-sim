/**
 * OP16-043 Usopp (Character, Blue, cost 2, 1000, Counter +1000, {Straw Hat Crew}/{Dressrosa}, [Blocker]).
 *
 * Card text: "[Blocker] [On K.O.] You may rest 1 of your {Dressrosa} type Leader or Stage cards: Return
 * up to 1 of your opponent's Characters with a cost of 5 or less to the owner's hand."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 10-2-17 / RD 110 ([On K.O.] after a K.O. in battle), CR 8-3-1-3
 * (a cost that cannot be paid), CR 1-3-2-1 (resting a rested card does nothing), CR 8-4-4-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passCounter } from '../../helpers.ts';
import {
  answerMay,
  BAT,
  choices,
  declineChoice,
  hand,
  inst,
  kind,
  LDR,
  mustBeUnpayable,
  need,
  offeredNow,
  payCost,
  pickInst,
  rested,
  SCN,
  SCN2,
  theirs,
  theirTurn,
  side,
  BLUE,
  RED,
  block,
  opponentKOs,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const USOPP = 'OP16-043';

/** p2 attacks p1's Leader with their `attacker`; p1's Usopp blocks and is K.O.'d. Stops at p1's first decision after that. */
function koUsopp(
  leader: string,
  opts: { stage?: string; p2?: string[]; leaderRested?: boolean } = {},
): TestGame {
  const g = theirTurn(
    {
      ...side(leader, BLUE, { characters: [USOPP], ...(opts.stage ? { stage: opts.stage } : {}) }),
      ...(opts.leaderRested ? { leader: { card: leader, rested: true } } : {}),
    },
    side(LDR.luffy, RED, {
      costArea: { active: 10, rested: 0 },
      characters: opts.p2 ?? [SCN.c3, SCN.c5, SCN.c6],
    }),
  );
  attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
  block(g, inst(g, 'p1', 'characters', USOPP));
  passCounter(g);
  return g;
}

describe('OP16-043 Usopp: [Blocker]; [On K.O.] rest a {Dressrosa} Leader or Stage: return an opposing Character with cost 5 or less to hand', () => {
  it('has [Blocker] and is offered as a blocker against an attack on the Leader', () => {
    const g = theirs(LDR.dressrosa, { characters: [USOPP] }, { characters: [SCN.c3] });
    expect(g.card(inst(g, 'p1', 'characters', USOPP)).keywords).toContain('Blocker');
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', USOPP)]);
  });

  it('K.O.’d in battle: pay by resting the {Dressrosa} Leader, return an opposing Character to its owner’s hand', () => {
    const g = koUsopp(LDR.dressrosa);
    need(g, 'optional', 'p1');
    answerMay(g, true);
    payCost(g);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c5)]);
    expect(rested(g, g.leader('p1'))).toBe(true);
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(USOPP);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(USOPP);
    expect(hand(g, 'p2')).toContain(SCN.c5);
    expect(g.zone('p2', 'characters').map((c) => c.card)).not.toContain(SCN.c5);
  });

  it('cost boundary: cost 5 is offered, cost 6 is not (the attacker of cost 3 is offered too)', () => {
    const g = koUsopp(LDR.dressrosa);
    answerMay(g, true);
    payCost(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([SCN.c3, SCN.c5].sort());
  });

  it('"up to 1": after paying, may return nothing; the Leader stays rested', () => {
    const g = koUsopp(LDR.dressrosa);
    answerMay(g, true);
    payCost(g);
    declineChoice(g);
    expect(rested(g, g.leader('p1'))).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expect(kind(g)).not.toBe('choose');
  });

  it('declining the optional cost: the Leader is not rested and nothing is returned', () => {
    const g = koUsopp(LDR.dressrosa);
    answerMay(g, false);
    expect(rested(g, g.leader('p1'))).toBe(false);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it('a {Dressrosa} Stage can pay instead when the Leader is not {Dressrosa}', () => {
    const g = koUsopp(LDR.dp, { stage: SCN2.dressStage });
    need(g, 'optional', 'p1');
    answerMay(g, true);
    payCost(g);
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c5)]);
    expect(g.card(g.zone('p1', 'stage')[0]!.instance).rested).toBe(true);
    expect(rested(g, g.leader('p1'))).toBe(false);
    expect(hand(g, 'p2')).toContain(SCN.c5);
  });

  it('with a {Dressrosa} Leader and a {Dressrosa} Stage both, the player picks which one to rest', () => {
    const g = koUsopp(LDR.dressrosa, { stage: SCN2.dressStage });
    answerMay(g, true);
    need(g, 'choose', 'p1');
    const stage = g.zone('p1', 'stage')[0]!.instance;
    expect(choices(g).sort()).toEqual([g.leader('p1'), stage].sort());
    payCost(g, stage);
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c5)]);
    expect(g.card(stage).rested).toBe(true);
    expect(rested(g, g.leader('p1'))).toBe(false);
  });

  it('no {Dressrosa} Leader or Stage: the cost cannot be paid and nothing is returned', () => {
    const g = koUsopp(LDR.dp);
    mustBeUnpayable(g);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it('CR 1-3-2-1: a {Dressrosa} Leader that is already rested cannot pay', () => {
    const g = koUsopp(LDR.dressrosa, { leaderRested: true });
    mustBeUnpayable(g);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it('must-not-happen: a block that Usopp survives (attacker power 0 < 1000) is not a K.O. and asks nothing', () => {
    const g = theirs(LDR.dressrosa, { characters: [USOPP] }, { characters: [BAT.cobra0] });
    attack(g, inst(g, 'p2', 'characters', BAT.cobra0), g.leader('p1'));
    block(g, inst(g, 'p1', 'characters', USOPP));
    passCounter(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(USOPP);
    expect(kind(g)).toBe('main');
  });

  it('[On K.O.] also fires when an opposing effect K.O.s it (Gum-Gum Lightning): same optional cost, same return', () => {
    const g = theirTurn(
      side(LDR.dressrosa, BLUE, { characters: [USOPP] }),
      side(LDR.luffy, RED, {
        costArea: { active: 10, rested: 0 },
        hand: [SCN2.lightning],
        characters: [SCN.c5],
      }),
    );
    opponentKOs(g, inst(g, 'p1', 'characters', USOPP));
    need(g, 'optional', 'p1');
    answerMay(g, true);
    payCost(g);
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c5)]);
    expect(rested(g, g.leader('p1'))).toBe(true);
    expect(hand(g, 'p2')).toContain(SCN.c5);
  });
});
