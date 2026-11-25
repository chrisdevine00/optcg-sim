/**
 * EB03-033 Charlotte Brulee (Character, Purple, cost 5, 6000, Counter +1000, Special, {Big Mom
 * Pirates}).
 *
 * Card text: "[Opponent's Turn] [Once Per Turn] When a DON!! card on your field is returned to your
 * DON!! deck by your effect, if your Leader has the {Big Mom Pirates} type, add up to 1 DON!! card
 * from your DON!! deck and rest it."
 *
 * Rules: CR 8-3-2-5 ([Opponent's Turn] is a condition), CR 10-2-13 ([Once Per Turn], per card),
 * CR 2-4-3 ("has the {X} type": exact type, any of several), CR 4-8-1 ("up to").
 *
 * Open question M6b-Q65 (is a DON!! -N COST "your effect"?): the positive tests use EB04-030
 * Kaido's printed replacement ("you may return 1 DON!! card from your field to your DON!! deck
 * instead"), an effect that is not a cost, so every reading agrees. The cost route is asserted only
 * where both readings agree (the negative cases, and the shared bounds in the last test).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, decision } from '../../helpers.ts';
import { withAbilities, type Ability } from '../../../../src/testing.ts';
import { myTurn, side, theirTurn } from '../kit.ts';
import {
  activateCounter,
  answerCount,
  asksCount,
  BLUE,
  countOptions,
  donOf,
  LW,
  need,
  no,
  onField,
  put,
  RED,
  returnDon,
  SW,
  yes,
} from './kit-w5a.ts';

const ID = 'EB03-033';
/** EB04-030 Kaido: cost 7, 9000, "If this Character would be K.O.'d, you may return 1 DON!! card from your field to your DON!! deck instead." */
const KAIDO = 'EB04-030';
/** OP17-099 Charlotte Linlin: Yellow Leader, {The Four Emperors}/{Big Mom Pirates}. */
const LINLIN = 'OP17-099';

/** p2's turn: p2's LittleOars Jr. (9000) attacks p1's rested Kaido (9000, so it would be K.O.'d). */
function theirs(
  leader: string,
  o: {
    kaidos?: number;
    oars?: number;
    don?: { active: number; rested: number };
    donDeck?: number;
    hand?: string[];
  } = {},
) {
  const kaidos = o.kaidos ?? 1;
  const mine: PlayerSpec['characters'] = [
    ...Array.from({ length: kaidos }, () => ({ card: KAIDO, rested: true })),
    ID,
  ];
  return theirTurn(
    side(leader, BLUE, {
      characters: mine,
      costArea: o.don ?? { active: 3, rested: 0 },
      ...(o.donDeck !== undefined ? { donDeck: o.donDeck } : {}),
      ...(o.hand ? { hand: o.hand } : {}),
    }),
    side(LW.luffy, RED, {
      characters: Array.from({ length: o.oars ?? 1 }, () => SW.oars),
      costArea: { active: 5, rested: 0 },
    }),
  );
}

/** p2's nth Oars attacks p1's nth Kaido; p1 neither blocks nor counters. Stops at the next question. */
function attackKaido(g: ReturnType<typeof theirs>, nth = 0) {
  attack(g, g.find('p2', 'characters', SW.oars, nth), g.find('p1', 'characters', KAIDO, nth));
  act(g, { type: 'block', blocker: null, player: 'p1' });
  act(g, { type: 'endCounter', player: 'p1' });
}

describe("EB03-033 Charlotte Brulee: [Opponent's Turn][Once Per Turn] DON!! returned by my effect, Big Mom Leader: add 1 rested DON!!", () => {
  it('a DON!! returned by my effect on the opponent turn adds 1 DON!! from the DON!! deck, rested', () => {
    const g = theirs(LW.bigMom);
    attackKaido(g);
    yes(g, 'p1');
    // 3 active, one returned; Brulee asks how many to add.
    expect(asksCount(g)).toBe(true);
    answerCount(g, 1);
    need(g, 'main', 'p2');
    expect(donOf(g)).toMatchObject({ active: 2, rested: 1, deck: 7 });
    expect(onField(g)).toBe(3);
    // Kaido was saved by its own replacement.
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(KAIDO);
  });

  it('"up to 1": the count offered is 1 or 0, and 0 adds nothing', () => {
    const g = theirs(LW.bigMom);
    attackKaido(g);
    yes(g, 'p1');
    expect(countOptions(g)).toEqual(['1', '0']);
    answerCount(g, 0);
    need(g, 'main', 'p2');
    expect(donOf(g)).toMatchObject({ active: 2, rested: 0, deck: 8 });
  });

  it('a Leader without the {Big Mom Pirates} type: nothing is added, and no question is asked', () => {
    const g = theirs(LW.luffy);
    attackKaido(g);
    yes(g, 'p1');
    need(g, 'main', 'p2');
    expect(donOf(g)).toMatchObject({ active: 2, rested: 0, deck: 8 });
  });

  it('a Leader with several types counts if one is {Big Mom Pirates} (The Four Emperors / Big Mom Pirates)', () => {
    const g = theirs(LINLIN);
    attackKaido(g);
    yes(g, 'p1');
    expect(asksCount(g)).toBe(true);
    answerCount(g, 1);
    expect(donOf(g)).toMatchObject({ active: 2, rested: 1, deck: 7 });
  });

  it("declining Kaido's replacement returns no DON!!, so Brulee does not fire (Kaido is K.O.'d)", () => {
    const g = theirs(LW.bigMom);
    attackKaido(g);
    no(g, 'p1');
    need(g, 'main', 'p2');
    expect(donOf(g)).toMatchObject({ active: 3, rested: 0, deck: 7 });
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(KAIDO);
  });

  it('[Once Per Turn]: a second return by my effect in the same opponent turn adds nothing', () => {
    const g = theirs(LW.bigMom, { kaidos: 2, oars: 2, don: { active: 4, rested: 0 } });
    attackKaido(g, 0);
    yes(g, 'p1');
    answerCount(g, 1);
    need(g, 'main', 'p2');
    expect(donOf(g)).toMatchObject({ active: 3, rested: 1, deck: 6 });
    // The second Kaido is attacked and saved the same way; Brulee has been used this turn.
    // (Each Kaido is now the nth card remaining; both are still on the field.)
    attack(g, g.find('p2', 'characters', SW.oars, 1), g.find('p1', 'characters', KAIDO, 1));
    act(g, { type: 'block', blocker: null, player: 'p1' });
    act(g, { type: 'endCounter', player: 'p1' });
    yes(g, 'p1');
    // Active and rested DON!! are both there now: the DON!! to return is picked.
    returnDon(g, 1, 'costActive');
    need(g, 'main', 'p2');
    expect(donOf(g)).toMatchObject({ active: 2, rested: 1, deck: 7 });
  });

  it("[Opponent's Turn] only: on my own turn a DON!! -2 return does not add anything", () => {
    const g = myTurn(
      side(LW.bigMom, BLUE, {
        hand: [SW.lightning],
        characters: [ID],
        costArea: { active: 6, rested: 0 },
      }),
      side(LW.luffy, RED, { characters: [SW.sai] }),
    );
    put(g, SW.lightning);
    yes(g, 'p1');
    returnDon(g, 2, 'costActive');
    // The K.O. target pick is "up to 1": choose nothing.
    act(g, { type: 'done' });
    // No Brulee question: back to the Main Phase.
    need(g, 'main', 'p1');
    // 6 active, 2 rested for the Event, 2 returned: 2 active + 2 rested remain.
    expect(donOf(g)).toMatchObject({ active: 2, rested: 2, deck: 6 });
  });

  it('an empty DON!! deck before the return: the returned DON!! is the one that can be added', () => {
    const g = theirs(LW.bigMom, { don: { active: 10, rested: 0 }, donDeck: 0 });
    attackKaido(g);
    yes(g, 'p1');
    expect(asksCount(g)).toBe(true);
    answerCount(g, 1);
    expect(donOf(g)).toMatchObject({ active: 9, rested: 1, deck: 0 });
  });

  it('the cost route (DON!! -N of a [Counter]): at most 1 DON!! is added and it is rested; no active DON!! appear (M6b-Q65)', () => {
    // Slow-Slow Beam Sword [Counter] DON!! -1. Under the reading that a cost is "your effect",
    // Brulee asks to add 1; under the competing reading it does not. Both agree on these bounds.
    const g = theirs(LW.bigMom, { hand: [SW.beamSword], don: { active: 4, rested: 0 } });
    attack(g, g.find('p2', 'characters', SW.oars), g.leader('p1'));
    act(g, { type: 'block', blocker: null, player: 'p1' });
    activateCounter(g, g.find('p1', 'hand', SW.beamSword));
    yes(g, 'p1');
    returnDon(g, 1, 'costActive');
    for (let i = 0; i < 6 && decision(g)?.player === 'p1'; i++) {
      const d = decision(g)!;
      if (d.kind === 'choose' && d.purpose === 'mode') answerCount(g, 1);
      else if (d.kind === 'choose') act(g, { type: 'done' });
      else break;
    }
    const d = donOf(g);
    // 4 active: 2 rested for the Event's cost, 1 returned: 1 active left; Brulee adds 0 or 1 rested.
    expect(d.active).toBe(1);
    expect([2, 3]).toContain(d.rested);
    expect(d.rested + d.deck + d.active).toBe(10);
  });

  it("W57-R9: only MY effect counts: the opponent making me return a DON!! on their turn adds nothing (kills cause 'yourEffect' to 'effect')", () => {
    const g = theirs(LW.bigMom, { kaidos: 0 });
    g.state = withAbilities(g.state, LW.luffy, [
      {
        id: 'r',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ do: { returnDon: { n: 1, player: 'opponent' } } }],
      } as Ability,
    ]);
    act(g, { type: 'activate', card: g.leader('p2'), ability: 'r' });
    expect(asksCount(g)).toBe(false);
    need(g, 'main', 'p2');
    expect(donOf(g)).toMatchObject({ active: 2, rested: 0 });
    expect(g.eventsOfType('DonReturned').length).toBeGreaterThan(0);
  });
});
