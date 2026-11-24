/**
 * OP16-039 Gum-Gum Twin Jet Pistol (Event, Green, cost 1, {Straw Hat Crew}/{Impel Down}).
 *
 * Card text: "[Main] Up to 1 of your [Monkey.D.Luffy] cards gains [Double Attack] during this turn.
 * Then, if your Leader has the {Impel Down} type, rest up to 2 of your opponent's Characters with a
 * cost of 3 or less. [Trigger] Rest your opponent's Leader."
 *
 * Rules: CR 2-1-2 ([Name] is exact), CR 10-1-2 ([Double Attack]), CR 4-10-2 ("then" after a clause
 * that cannot resolve still resolves), CR 8-4-4-1 ("up to" allows 0), CR 6-6-1-3 ("during this
 * turn"), CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import { attack, noDefence } from '../../helpers.ts';
import {
  activateTrigger,
  at,
  backAtMain,
  choices,
  hitLeader,
  inst,
  kind,
  LDR,
  mine,
  need,
  offeredNow,
  pickInst,
  put,
  rested,
  SCN,
  theirs,
  toMyNextMain,
  declineChoice,
} from './kit-op16b.ts';

const EVT = 'OP16-039';
/** OP07-033 Monkey.D.Luffy: cost 5, 6000, Counter +1000, {Straw Hat Crew}/{Supernovas}. Inert with fewer than 3 Characters. */
const LUFFY = 'OP07-033';
const DA = 'Double Attack';

function start(leader: string, chars: string[], p2: string[], extra: string[] = []) {
  return mine(leader, { hand: [EVT], characters: [...chars, ...extra] }, { characters: p2 });
}

describe('OP16-039 Gum-Gum Twin Jet Pistol: [Main] [Monkey.D.Luffy] gains [Double Attack]; then with an {Impel Down} Leader rest up to 2 cost-3-or-less Characters', () => {
  it('gives the chosen [Monkey.D.Luffy] [Double Attack] during this turn', () => {
    const g = start(LDR.impel, [LUFFY], [SCN.c1]);
    put(g, EVT);
    need(g, 'choose', 'p1');
    expect(g.card(at(g, 'p1', 'characters', LUFFY)).keywords).not.toContain(DA);
    pickInst(g, [at(g, 'p1', 'characters', LUFFY)]);
    expect(g.card(at(g, 'p1', 'characters', LUFFY)).keywords).toContain(DA);
  });

  it('the [Double Attack] is real: Luffy (6000) hitting the 5000 Leader deals 2 damage', () => {
    const g = start(LDR.luffy, [LUFFY], []);
    put(g, EVT);
    pickInst(g, [at(g, 'p1', 'characters', LUFFY)]);
    expect(backAtMain(g)).toBe(true);
    attack(g, at(g, 'p1', 'characters', LUFFY), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(2);
  });

  it('only a card named exactly [Monkey.D.Luffy] is offered: a Character with another name is not', () => {
    const g = start(LDR.impel, [LUFFY, SCN.c3], []);
    put(g, EVT);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([LUFFY]);
  });

  it('with an {Impel Down} Leader: rests up to 2 opposing Characters with cost 3 or less (a cost-4 Character is not offered)', () => {
    const g = start(LDR.impel, [LUFFY], [SCN.c1, SCN.c3, SCN.c4]);
    put(g, EVT);
    pickInst(g, [at(g, 'p1', 'characters', LUFFY)]);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([SCN.c1, SCN.c3].sort());
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c1), inst(g, 'p2', 'characters', SCN.c3)]);
    expect(backAtMain(g)).toBe(true);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c1))).toBe(true);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c3))).toBe(true);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c4))).toBe(false);
  });

  it('"up to 2": the controller may rest just 1, or none', () => {
    const one = start(LDR.impel, [LUFFY], [SCN.c1, SCN.c3]);
    put(one, EVT);
    pickInst(one, [at(one, 'p1', 'characters', LUFFY)]);
    pickInst(one, [inst(one, 'p2', 'characters', SCN.c3)]);
    expect(rested(one, inst(one, 'p2', 'characters', SCN.c3))).toBe(true);
    expect(rested(one, inst(one, 'p2', 'characters', SCN.c1))).toBe(false);

    const none = start(LDR.impel, [LUFFY], [SCN.c1, SCN.c3]);
    put(none, EVT);
    pickInst(none, [at(none, 'p1', 'characters', LUFFY)]);
    declineChoice(none);
    expect(backAtMain(none)).toBe(true);
    expect(none.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('a Leader without the {Impel Down} type: [Double Attack] is still given, nothing is rested and no choice is asked', () => {
    const g = start(LDR.dp, [LUFFY], [SCN.c1, SCN.c3]);
    put(g, EVT);
    pickInst(g, [at(g, 'p1', 'characters', LUFFY)]);
    expect(backAtMain(g)).toBe(true);
    expect(g.card(at(g, 'p1', 'characters', LUFFY)).keywords).toContain(DA);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('CR 4-10-2: with no [Monkey.D.Luffy] to choose, the "then" part still rests Characters', () => {
    const g = start(LDR.impel, [SCN.c3], [SCN.c1]);
    put(g, EVT);
    if (kind(g) === 'choose' && choices(g).length === 0) declineChoice(g);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c1)]);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c1))).toBe(true);
  });

  it('the Leader card [Monkey.D.Luffy] is a "[Monkey.D.Luffy] card": it can be chosen to gain [Double Attack]', () => {
    const g = start(LDR.luffy, [LUFFY], []);
    put(g, EVT);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).keywords).toContain(DA);
    expect(g.card(at(g, 'p1', 'characters', LUFFY)).keywords).not.toContain(DA);
  });

  it('"during this turn": the [Double Attack] is gone on my next turn', () => {
    const g = start(LDR.luffy, [LUFFY], []);
    put(g, EVT);
    pickInst(g, [at(g, 'p1', 'characters', LUFFY)]);
    toMyNextMain(g);
    expect(g.card(at(g, 'p1', 'characters', LUFFY)).keywords).not.toContain(DA);
  });

  it('[Trigger]: activating it from Life rests the opponent’s Leader', () => {
    const g = theirs(
      LDR.luffy,
      { life: [EVT, SCN.c1, SCN.c1, SCN.c1] },
      { characters: [SCN.c3] },
      LDR.luffy,
    );
    expect(rested(g, g.leader('p2'))).toBe(false);
    hitLeader(g, inst(g, 'p2', 'characters', SCN.c3));
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(rested(g, g.leader('p2'))).toBe(true);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });
});
