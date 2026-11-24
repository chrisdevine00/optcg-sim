/**
 * EB03-017 Jewelry Bonney (Character, Green, cost 5, 6000, Counter +1000, {Bonney Pirates}/{Supernovas}).
 *
 * Card text: "[On Play] If your Leader has the {Supernovas} type, set up to 1 of your DON!! cards as
 * active. Then, up to 1 of your opponent's Characters with a cost of 8 or less cannot be rested until
 * the end of your opponent's next End Phase."
 *
 * Rules: CR 8-3-3 / CR 4-10-1 (a "Then" after a failed "If" does not resolve, M4b-5), CR 8-4-4-1
 * ("up to"), "set up to N DON!! as active" asks a count, most first (DECISIONS 2026-11-24), "until the
 * end of your opponent's next End Phase" created on my turn lasts through the opponent's whole next
 * turn (RL-11). Rest effects used to probe "cannot be rested": OP17-038 [Main] (rest up to 1 opposing
 * Character) on my turns, EB04-020 [Trigger] (rest up to 1 opposing cost-4-or-less Character) on theirs.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  attack,
  BLUE,
  choices,
  chr,
  donOf,
  fill,
  isRestedC,
  kind,
  LA,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  restCost,
  SA,
  takeMost,
  yes,
  decision,
} from './kit-eb03a.ts';

const BONNEY = 'EB03-017';

/** p1 plays Bonney with `leader`; p2 holds `p2` Characters; p1 has `active`/`rested` DON!! after the 5 for Bonney. */
function play(
  leader: string,
  p2: string[],
  o: { rested?: number; hand?: string[]; life?: string[] } = {},
) {
  const g = mine(
    leader,
    {
      hand: [BONNEY, ...(o.hand ?? [])],
      costArea: { active: 10 - (o.rested ?? 0), rested: o.rested ?? 0 },
      deck: fill(BLUE, 15),
      ...(o.life ? { life: o.life } : {}),
    },
    { characters: p2 },
  );
  playRaw(g, BONNEY);
  return g;
}

/** p1 uses OP17-038 (rest 4 of your cards: rest up to 1 opposing Character) on `target`. Returns true if the target was offered. */
function restWithEvent(g: ReturnType<typeof play>, target: string): boolean {
  playRaw(g, SA.restEvent);
  yes(g, 'p1');
  restCost(g, [], 4);
  need(g, 'choose', 'p1');
  const offered = choices(g).includes(target);
  if (offered) pickInst(g, [target]);
  else none(g);
  return offered;
}

describe('EB03-017 Jewelry Bonney: printed values', () => {
  it('cost 5, 6000, Counter +1000', () => {
    const g = mine(LA.supernovas, { characters: [BONNEY] });
    const b = chr(g, 'p1', BONNEY);
    expect(g.card(b).cost).toBe(5);
    expect(g.power(b)).toBe(6000);
    expect(g.card(b).counter).toBe(1000);
  });
});

describe('EB03-017 Jewelry Bonney: [On Play] if your Leader has {Supernovas}, set up to 1 DON!! active', () => {
  it('sets 1 rested DON!! card as active', () => {
    const g = play(LA.supernovas, [SA.kingdew], { rested: 3 });
    // 7 active and 3 rested before the play; Bonney's 5 leave 2 active and 8 rested.
    const before = donOf(g, 'p1');
    expect(before.rested).toBe(8);
    takeMost(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 7 });
  });

  it('"up to 1": may set none', () => {
    const g = play(LA.supernovas, [SA.kingdew], { rested: 3 });
    need(g, 'choose', 'p1');
    const d = decision(g)!;
    expect(d.purpose).toBe('mode');
    const none0 = d.options!.find((o) => o.id === '0' || /none/i.test(o.label))!;
    act(g, { type: 'pick', choice: { option: none0.id } });
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 8 });
  });

  it('with a Leader without {Supernovas} no DON!! is set active', () => {
    const g = play(LA.croc, [SA.kingdew], { rested: 3 });
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 8 });
    expect(kind(g)).toBe('main');
  });

  it("with no rested DON!! other than Bonney's cost, the next prompt is the Character pick", () => {
    // 10 active DON!!, Bonney costs 5: the 5 spent DON!! are rested, so 5 rested are available.
    const g = play(LA.supernovas, [SA.kingdew]);
    takeMost(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1 + 5, rested: 4 });
  });
});

describe("EB03-017 Jewelry Bonney: [On Play] Then, up to 1 opposing Character with cost 8 or less cannot be rested until the end of the opponent's next End Phase", () => {
  it('offers the opposing Characters with cost 8 or less (8 is allowed, 9 is not), never my own', () => {
    const g = play(LA.supernovas, [SA.shiki8, SA.mihawk9, SA.sai], { rested: 0 });
    takeMost(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SA.shiki8, SA.sai].sort());
  });

  it('the chosen Character cannot be rested by my rest effect', () => {
    const g = play(LA.supernovas, [SA.shiki8, SA.kingdew], { hand: [SA.restEvent] });
    takeMost(g);
    pickInst(g, [chr(g, 'p2', SA.shiki8)]);
    restWithEvent(g, chr(g, 'p2', SA.shiki8));
    expect(isRestedC(g, 'p2', SA.shiki8)).toBe(false);
  });

  it('only the chosen Character is protected: another opposing Character can still be rested', () => {
    const g = play(LA.supernovas, [SA.shiki8, SA.kingdew], { hand: [SA.restEvent] });
    takeMost(g);
    pickInst(g, [chr(g, 'p2', SA.shiki8)]);
    expect(restWithEvent(g, chr(g, 'p2', SA.kingdew))).toBe(true);
    expect(isRestedC(g, 'p2', SA.kingdew)).toBe(true);
  });

  it('"up to 1": choosing nobody protects nobody', () => {
    const g = play(LA.supernovas, [SA.kingdew], { hand: [SA.restEvent] });
    takeMost(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(restWithEvent(g, chr(g, 'p2', SA.kingdew))).toBe(true);
    expect(isRestedC(g, 'p2', SA.kingdew)).toBe(true);
  });

  it('with a Leader without {Supernovas} the "Then" does not resolve: no prompt and no protection', () => {
    const g = play(LA.croc, [SA.kingdew], { hand: [SA.restEvent] });
    expect(kind(g)).toBe('main');
    expect(restWithEvent(g, chr(g, 'p2', SA.kingdew))).toBe(true);
    expect(isRestedC(g, 'p2', SA.kingdew)).toBe(true);
  });

  it("the protection holds through the opponent's turn and ends with their End Phase", () => {
    const g = play(LA.supernovas, [SA.hajrudin, SA.sai], {
      hand: [SA.restEvent],
      life: [SA.restTrigger, BLUE, BLUE, BLUE],
    });
    takeMost(g);
    pickInst(g, [chr(g, 'p2', SA.hajrudin)]);
    need(g, 'main', 'p1');
    act(g, { type: 'endTurn' });
    // p2's turn: p2's Leader hits my Leader; my top Life card is EB04-020 with a [Trigger] rest.
    need(g, 'main', 'p2');
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    if (choices(g).includes(chr(g, 'p2', SA.hajrudin))) pickInst(g, [chr(g, 'p2', SA.hajrudin)]);
    else none(g);
    expect(isRestedC(g, 'p2', SA.hajrudin)).toBe(false);
    // p2 ends the turn; at p1's next Main Phase the protection is over.
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(restWithEvent(g, chr(g, 'p2', SA.hajrudin))).toBe(true);
    expect(isRestedC(g, 'p2', SA.hajrudin)).toBe(true);
  });
});
