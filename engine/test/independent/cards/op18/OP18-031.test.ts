/**
 * OP18-031 Nico Robin (Character, Green, cost 4, 5000, Counter +1000, {Water Seven}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[Opponent's Turn] If your Character would be removed from the field by your opponent's effect,
 *    you may rest this Character instead.
 *    [End of Your Turn] Set up to 1 of your {Water Seven} type cards and up to 1 of your DON!!
 *    cards as active."
 *
 * Rules: an optional replacement (CR 8-1-3-4, 8-1-3-4-1); an impossible replacement cannot be
 * applied (CR 8-1-3-4-5: a rested Robin cannot be rested again). A K.O. in battle is not an effect.
 * "[Opponent's Turn]" works only on the opponent's turn. "Set up to N" asks a count for DON!!
 * (OP14-R2) and a target pick for the cards. {Water Seven} cards may be a Leader, Character or
 * Stage ("type cards"). Robin herself is {Water Seven}.
 *
 * Opponent removal: OP09-077 Gum-Gum Lightning (K.O. up to 1 Character with 6000 power or less).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, noDefence, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  AKP,
  BLUE,
  choose,
  CH,
  choices,
  decline,
  donOf,
  LEAD,
  LDR,
  mine,
  myTurn,
  need,
  offered,
  payDon,
  pickCount,
  pickInst,
  PURPLE,
  RED,
  side,
  skipPick,
  sortedIds,
  STG,
  theirTurn,
  type Chars,
  kind,
  askedCount,
} from './kit-ga.ts';

const ROBIN = 'OP18-031';

/** p2's turn: p2 (Kaido Leader) holds Gum-Gum Lightning; p1 has Robin and `chars` on the field. */
function threatened(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return theirTurn(
    side(LDR.luffy, RED, { characters: [ROBIN, CH.usopp3], ...p1 }),
    side(LEAD.kaido, PURPLE, { hand: [AKP.lightning], costArea: { active: 4, rested: 0 }, ...p2 }),
  );
}

/** p2 plays Gum-Gum Lightning, pays DON!! -2 and targets `target`. */
function lightning(g: TestGame, target: string) {
  play(g, g.find('p2', 'hand', AKP.lightning));
  if (offered(g, 'p2')) accept(g);
  payDon(g, 2);
  choose(g, [target]);
}

/** p1's Main Phase with Robin and `chars`; the turn is ended and the first [End of Your Turn] prompt is pending. */
function endOfTurn(chars: Chars, spec: Partial<PlayerSpec> = {}) {
  const g = mine(LDR.luffy, { characters: chars, costArea: { active: 5, rested: 3 }, ...spec });
  act(g, { type: 'endTurn' });
  return g;
}

describe('OP18-031 Nico Robin: [Opponent’s Turn] rest this Character instead of a Character removed by the opponent’s effect', () => {
  it('happy path: an opponent’s K.O. on another Character; accepting rests Robin and the Character stays', () => {
    const g = threatened();
    const usopp = g.find('p1', 'characters', CH.usopp3);
    lightning(g, usopp);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([CH.usopp3, ROBIN].sort());
    expect(g.card(g.find('p1', 'characters', ROBIN)).rested).toBe(true);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([]);
  });

  it('it protects any Character, whatever its type (Marco has no relevant type)', () => {
    const g = threatened({ characters: [ROBIN, CH.marco3] });
    lightning(g, g.find('p1', 'characters', CH.marco3));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([CH.marco3, ROBIN].sort());
  });

  it('CR 8-1-3-4-1: declining lets the K.O. happen and Robin stays active', () => {
    const g = threatened();
    lightning(g, g.find('p1', 'characters', CH.usopp3));
    decline(g);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.usopp3]);
    expect(g.card(g.find('p1', 'characters', ROBIN)).rested).toBe(false);
  });

  it('CR 8-1-3-4-5: a rested Robin cannot be rested again, so the K.O. happens with no offer', () => {
    const g = threatened({ characters: [{ card: ROBIN, rested: true }, CH.usopp3] });
    lightning(g, g.find('p1', 'characters', CH.usopp3));
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.usopp3]);
  });

  it('CR 10-2-1-1: a K.O. in battle is not an effect: no offer', () => {
    // p2's OP02-007 Thatch (8000) attacks the rested Usopp (5000).
    const g = threatened(
      { characters: [ROBIN, { card: CH.usopp3, rested: true }] },
      { characters: [CH.thatch6] },
    );
    attack(g, g.find('p2', 'characters', CH.thatch6), g.find('p1', 'characters', CH.usopp3));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.usopp3]);
  });

  it('"[Opponent’s Turn]" and "your opponent’s effect": p1’s own effect on p1’s turn gets no offer', () => {
    const g = myTurn(
      side(LEAD.rocks, BLUE, {
        characters: [ROBIN, CH.usopp3],
        hand: ['OP17-046'],
        costArea: { active: 4, rested: 0 },
      }),
      side(LDR.luffy, RED),
    );
    play(g, g.find('p1', 'hand', 'OP17-046'));
    choose(g, [g.find('p1', 'characters', CH.usopp3)]);
    expect(offered(g, 'p1')).toBe(false);
    expect(g.card(g.find('p1', 'characters', ROBIN)).rested).toBe(false);
  });

  it('CR 2-8-2: Robin in hand does nothing', () => {
    const g = threatened({ characters: [CH.usopp3], hand: [ROBIN] });
    lightning(g, g.find('p1', 'characters', CH.usopp3));
    expect(offered(g, 'p1')).toBe(false);
  });
});

describe('OP18-031 Nico Robin: [End of Your Turn] set up to 1 {Water Seven} card and up to 1 DON!! as active', () => {
  it('happy path: a rested {Water Seven} Character and a rested DON!! become active', () => {
    const g = endOfTurn([ROBIN, { card: CH.kiwi2, rested: true }]);
    const kiwi = g.find('p1', 'characters', CH.kiwi2);
    expect(choices(g)).toContain(kiwi);
    pickInst(g, [kiwi]);
    pickCount(g, 1);
    expect(g.card(kiwi).rested).toBe(false);
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 2 });
    expect(kind(g)).toBe('main');
  });

  it('"type cards": a rested {Water Seven} Stage can be set too', () => {
    const g = endOfTurn([ROBIN], { stage: { card: STG.galley, rested: true } });
    const stage = g.find('p1', 'stage', STG.galley);
    expect(choices(g)).toContain(stage);
    pickInst(g, [stage]);
    skipDon(g);
    expect(g.card(stage).rested).toBe(false);
  });

  it('"up to 1": two rested {Water Seven} Characters, only one is set', () => {
    const g = endOfTurn([
      ROBIN,
      { card: CH.kiwi2, rested: true },
      { card: CH.kiwi2, rested: true },
    ]);
    const k0 = g.find('p1', 'characters', CH.kiwi2, 0);
    pickInst(g, [k0]);
    skipDon(g);
    expect(g.card(k0).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', CH.kiwi2, 1)).rested).toBe(true);
  });

  it('a non-{Water Seven} rested Character (Usopp) is not offered', () => {
    const g = endOfTurn([
      ROBIN,
      { card: CH.usopp3, rested: true },
      { card: CH.kiwi2, rested: true },
    ]);
    expect(choices(g)).not.toContain(g.find('p1', 'characters', CH.usopp3));
    expect(choices(g)).toContain(g.find('p1', 'characters', CH.kiwi2));
  });

  it('Robin herself is {Water Seven}: a rested Robin can be set active', () => {
    const g = endOfTurn([{ card: ROBIN, rested: true }]);
    const robin = g.find('p1', 'characters', ROBIN);
    expect(choices(g)).toContain(robin);
    pickInst(g, [robin]);
    skipDon(g);
    expect(g.card(robin).rested).toBe(false);
  });

  it('"up to 1": the card may be skipped; the DON!! part is independent and still happens', () => {
    const g = endOfTurn([ROBIN, { card: CH.kiwi2, rested: true }]);
    skipPick(g);
    pickCount(g, 1);
    expect(g.card(g.find('p1', 'characters', CH.kiwi2)).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 2 });
  });

  it('"up to 1" DON!!: choosing none leaves the rested DON!! rested', () => {
    const g = endOfTurn([ROBIN, { card: CH.kiwi2, rested: true }]);
    pickInst(g, [g.find('p1', 'characters', CH.kiwi2)]);
    pickCount(g, 0);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 3 });
  });

  it('"up to 1" DON!!: the count offered is at most 1', () => {
    const g = endOfTurn([ROBIN, { card: CH.kiwi2, rested: true }]);
    pickInst(g, [g.find('p1', 'characters', CH.kiwi2)]);
    expect(askedCount(g)).toBe(true);
    const ids = (need(g, 'choose').options ?? []).map((o) => o.id).sort();
    expect(ids).toEqual(['0', '1']);
  });

  it('"[End of Your Turn]": at the end of the opponent’s turn p1 is asked nothing', () => {
    const g = endOfTurn([ROBIN, { card: CH.kiwi2, rested: true }]);
    skipPick(g);
    pickCount(g, 0);
    expect(need(g, 'main', 'p2')).toBeTruthy();
    act(g, { type: 'endTurn' });
    // Straight to p1's Main Phase: no [End of Your Turn] prompt came up at p2's end.
    expect(need(g, 'main', 'p1')).toBeTruthy();
  });

  it('CR 2-8-2: without Robin on the field nothing is asked at the end of the turn', () => {
    const g = mine(LDR.luffy, {
      characters: [{ card: CH.kiwi2, rested: true }],
      costArea: { active: 5, rested: 3 },
    });
    act(g, { type: 'endTurn' });
    expect(need(g, 'main', 'p2')).toBeTruthy();
    expect(g.card(g.find('p1', 'characters', CH.kiwi2)).rested).toBe(true);
  });
});

/** Answer the DON!! count of Robin's [End of Your Turn] with none, if it is asked. */
function skipDon(g: TestGame) {
  if (askedCount(g)) pickCount(g, 0);
}
