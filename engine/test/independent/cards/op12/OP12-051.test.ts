/**
 * OP12-051 Hina (Character, Blue, cost 3, 3000, Counter +2000, {Navy}).
 *
 * Card text: "[Activate: Main] You may rest this Character and trash 1 card from your hand: Up to 1 of
 * your opponent's Characters with a base cost of 4 or less cannot activate [Blocker] during this
 * turn."
 *
 * Rules: the cost is rest this Character plus trash 1 card; both must be payable (CR 8-3-1-3). It
 * only reaches opposing Characters whose BASE cost is 4 or less; "up to 1" may be none. "During
 * this turn" ends with my turn (CR 8-6). It stops that Character from being used as a Blocker; the
 * other Characters block as usual.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  chars,
  hand,
  kind,
  LB,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  payHand,
  pickInst,
  SB,
  toMyNextMain,
  trash,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const HINA = 'OP12-051';

/** p1: Hina and Marco (ready to attack) on the field, Sai in hand; p2 has `defenders`. */
function setup(
  defenders: string[],
  opts: { hinaRested?: boolean; hand?: string[] } = {},
): TestGame {
  return mine(
    LB.croc,
    {
      hand: opts.hand ?? [SB.sai],
      characters: [{ card: HINA, rested: opts.hinaRested ?? false }, SB.marco],
    },
    { characters: defenders },
  );
}

function useHina(g: TestGame): void {
  const hina = g.find('p1', 'characters', HINA);
  act(g, { type: 'activate', card: hina, ability: offeredAbilities(g, hina)[0]! });
  payHand(g, [SB.sai]);
}

describe('OP12-051 Hina: rest + trash 1: a base cost 4 or less Character cannot activate [Blocker] this turn', () => {
  it('the chosen Blocker (base cost 4) cannot block my attack; Hina rests and the card is trashed', () => {
    const g = setup([SB.franky4]);
    useHina(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.franky4]);
    pickInst(g, [g.find('p2', 'characters', SB.franky4)]);
    expect(g.card(g.find('p1', 'characters', HINA)).rested).toBe(true);
    expect(trash(g)).toEqual([SB.sai]);
    attack(g, g.find('p1', 'characters', SB.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('control: without the effect the same Blocker can block', () => {
    const g = setup([SB.franky4]);
    attack(g, g.find('p1', 'characters', SB.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', SB.franky4)]);
  });

  it('boundary: a base cost 5 Character is not a legal target (Blocker still blocks), cost 4 is', () => {
    const g = setup([SB.franky4, SB.nami5]);
    useHina(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.franky4]);
    pickInst(g, [g.find('p2', 'characters', SB.franky4)]);
    attack(g, g.find('p1', 'characters', SB.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', SB.nami5)]);
  });

  it('a base cost 2 Blocker (well under the limit) is a target as well', () => {
    const g = setup([SB.ideo]);
    useHina(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.ideo]);
  });

  it('only the one chosen Blocker is stopped: another Blocker of cost 4 or less still blocks', () => {
    const g = setup([SB.franky4, SB.ideo]);
    useHina(g);
    pickInst(g, [g.find('p2', 'characters', SB.franky4)]);
    attack(g, g.find('p1', 'characters', SB.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', SB.ideo)]);
  });

  it('"up to 1": the target may be left empty; the cost is paid and the Blocker still blocks', () => {
    const g = setup([SB.franky4]);
    useHina(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(trash(g)).toEqual([SB.sai]);
    attack(g, g.find('p1', 'characters', SB.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', SB.franky4)]);
  });

  it('cost: a rested Hina cannot be activated', () => {
    const g = setup([SB.franky4], { hinaRested: true });
    expect(offeredAbilities(g, g.find('p1', 'characters', HINA))).toEqual([]);
  });

  it('cost: with an empty hand Hina cannot be activated (the trash cannot be paid)', () => {
    const g = setup([SB.franky4], { hand: [] });
    expect(offeredAbilities(g, g.find('p1', 'characters', HINA))).toEqual([]);
    expect(hand(g)).toEqual([]);
  });

  it('only this turn: next turn the Blocker can block again', () => {
    const g = setup([SB.franky4]);
    useHina(g);
    pickInst(g, [g.find('p2', 'characters', SB.franky4)]);
    toMyNextMain(g);
    attack(g, g.find('p1', 'characters', SB.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', SB.franky4)]);
  });

  it("only the opponent's Characters are offered, never mine", () => {
    const g = mine(
      LB.croc,
      { hand: [SB.sai], characters: [HINA, SB.ideo] },
      { characters: [SB.franky4] },
    );
    useHina(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.franky4]);
    expect(kind(g)).toBe('choose');
    expect(chars(g)).toEqual([HINA, SB.ideo].sort());
  });
});
