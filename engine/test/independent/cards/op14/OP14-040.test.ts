/**
 * OP14-040 Jinbe (Leader, Blue, 5000, {Fish-Man}/{The Seven Warlords of the Sea}/{The Sun Pirates}).
 *
 * Card text: "[Activate: Main] You may trash 1 card from your hand: Give up to 2 rested DON!! cards to
 * 1 of your {Fish-Man} or {Merfolk} type Leader or Character cards."
 *
 * Rules: CR 8-3-1 (cost all or nothing), CR 4-8-1 ("up to"), CR 6-5-5-2 (a given DON!! adds +1000
 * on its owner's turn), M4b-4 (the giver may give fewer than the maximum).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, InstanceId } from '@optcg/engine';
import { act, decision } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  abilities,
  asksDonCount,
  atMain,
  BLUE,
  C14,
  choices,
  donCountOptions,
  donSum,
  hand,
  inst,
  L14,
  mine,
  need,
  offeredNow,
  takeDon,
  trash,
} from './kit-op14b.ts';

function start(
  o: {
    hand?: CardId[];
    chars?: CardId[];
    active?: number;
    rested?: number;
    p2chars?: CardId[];
  } = {},
) {
  return mine(
    L14.jinbe,
    {
      hand: o.hand ?? [C14.sai, BLUE],
      characters: o.chars ?? [],
      costArea: { active: o.active ?? 3, rested: o.rested ?? 4 },
    },
    { characters: o.p2chars ?? [] },
  );
}
/** Activate and pay: trash `pay` from hand. Leaves the count or target prompt pending. */
function begin(g: TestGame, pay: CardId = C14.sai) {
  const ability = abilities(g, g.leader('p1'));
  expect(ability).toHaveLength(1);
  act(g, { type: 'activate', card: g.leader('p1'), ability: ability[0]! });
  need(g, 'choose', 'p1');
  const hit = g.zone('p1', 'hand').find((c) => c.card === pay)!;
  act(g, { type: 'pick', choice: hit.instance });
}
/** Answer the count (when asked) and the target. */
function give(g: TestGame, n: number, target: InstanceId) {
  if (asksDonCount(g)) takeDon(g, n);
  // A sole candidate (only the Leader) is resolved by the engine without a question.
  if (decision(g)?.kind === 'choose') act(g, { type: 'pick', choice: target });
  else expect(target).toBe(g.leader('p1'));
}

describe('OP14-040 Jinbe: [Activate: Main] trash 1 card from hand: give up to 2 rested DON!! to a {Fish-Man} or {Merfolk} Leader or Character', () => {
  it('gives 2 rested DON!! to the Leader (a {Fish-Man}): the Leader has +2000 power and the card was trashed', () => {
    const g = start();
    begin(g);
    give(g, 2, g.leader('p1'));
    expect(atMain(g)).toBe(true);
    expect(donSum(g)).toMatchObject({ active: 3, rested: 2, given: 2 });
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(trash(g)).toEqual([C14.sai]);
    expect(hand(g)).toEqual([BLUE]);
  });

  it('a {Fish-Man} Character and a {Merfolk} Character are valid targets; a Character of neither type is not offered', () => {
    const g = start({ chars: [C14.namule, C14.camie, C14.marco] });
    begin(g);
    if (asksDonCount(g)) takeDon(g, 2);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.camie, C14.namule, L14.jinbe].sort());
    expect(choices(g)).toContain(g.leader('p1'));
  });

  it('the DON!! can be given to a Merfolk Character: it gains +2000 power on my turn', () => {
    const g = start({ chars: [C14.camie] });
    begin(g);
    give(g, 2, inst(g, 'p1', 'characters', C14.camie));
    expect(g.power(inst(g, 'p1', 'characters', C14.camie))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(donSum(g)).toMatchObject({ rested: 2, given: 2 });
  });

  it("the opponent's Characters are never offered, even Fish-Man ones", () => {
    const g = start({ p2chars: [C14.namule] });
    begin(g);
    if (asksDonCount(g)) takeDon(g, 2);
    // Only the Leader is a valid target: either asked with one candidate or resolved by itself.
    if (decision(g)?.kind === 'choose') expect(choices(g)).toEqual([g.leader('p1')]);
    expect(donSum(g)).toMatchObject({ rested: 2, given: 2 });
  });

  it('"up to 2": the count offered is 2, 1 or none', () => {
    const g = start();
    begin(g);
    expect(asksDonCount(g)).toBe(true);
    expect(donCountOptions(g).sort()).toEqual(['0', '1', '2']);
  });

  it('giving only 1 is allowed: one DON!! moves, one stays rested', () => {
    const g = start();
    begin(g);
    give(g, 1, g.leader('p1'));
    expect(donSum(g)).toMatchObject({ active: 3, rested: 3, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('giving none is allowed, and the hand card is still trashed (the cost was paid)', () => {
    const g = start();
    begin(g);
    if (asksDonCount(g)) takeDon(g, 0);
    expect(donSum(g)).toMatchObject({ active: 3, rested: 4, given: 0 });
    expect(trash(g)).toEqual([C14.sai]);
  });

  it('with only 1 rested DON!! at most 1 can be given', () => {
    const g = start({ rested: 1, active: 3 });
    begin(g);
    if (asksDonCount(g)) expect(donCountOptions(g)).not.toContain('2');
    give(g, 1, g.leader('p1'));
    expect(donSum(g)).toMatchObject({ rested: 0, given: 1 });
  });

  it('only RESTED DON!! are given: with all DON!! active nothing is given', () => {
    const g = start({ active: 5, rested: 0 });
    const ability = abilities(g, g.leader('p1'));
    if (ability.length) {
      begin(g);
      if (asksDonCount(g)) takeDon(g, 0);
      else if (kindIsChoose(g)) act(g, { type: 'pick', choice: g.leader('p1') });
    }
    expect(donSum(g)).toMatchObject({ active: 5, given: 0 });
  });

  it('the cost is a card from the hand: with an empty hand no DON!! can be given', () => {
    const g = start({ hand: [] });
    const ability = abilities(g, g.leader('p1'));
    if (ability.length) act(g, { type: 'activate', card: g.leader('p1'), ability: ability[0]! });
    expect(donSum(g)).toMatchObject({ rested: 4, given: 0 });
  });

  it('there is no once-per-turn limit: a second activation gives 2 more DON!! (with 2 hand cards)', () => {
    const g = start({ hand: [C14.sai, BLUE] });
    begin(g, C14.sai);
    give(g, 2, g.leader('p1'));
    begin(g, BLUE);
    give(g, 2, g.leader('p1'));
    expect(donSum(g)).toMatchObject({ rested: 0, given: 4 });
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(hand(g)).toEqual([]);
  });
});

function kindIsChoose(g: TestGame): boolean {
  return g.legal().some((a) => a.type === 'pick');
}
