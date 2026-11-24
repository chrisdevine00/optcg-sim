/**
 * OP12-059 Concasser (Event, Blue, cost 1, {Straw Hat Crew}/{Sky Island}).
 *
 * Card text: "[Main] If your Leader is [Sanji], draw 1 card. [Counter] If you have 4 or more Events in
 * your trash, up to 1 of your Leader gains +4000 power during this battle."
 *
 * Rules: "[Sanji]" means a Leader whose NAME is Sanji (a Leader named "Roronoa Zoro & Sanji" is not
 * [Sanji]). An Event is trashed when it is played, before its effect resolves (rules-digest 74,
 * CR 2-7-3, 8-4-2), so Concasser itself is among the Events in my trash while its [Counter]
 * resolves. Only my trash counts, and only Event cards. "Up to 1 of your Leader" names the Leader
 * only; "during this battle" ends with the battle.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  attack,
  cast,
  chars,
  deck,
  don,
  hand,
  kind,
  LB,
  mine,
  need,
  none,
  passBlock,
  passCounter,
  pickInst,
  SB,
  theirs,
  trash,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const CONCASSER = 'OP12-059';
/** ST01-014 Guard Point: Red Event. */
const EV = SB.event;
/** ST12-001 Roronoa Zoro & Sanji: Blue/Green Leader, NOT named [Sanji]. */
const ZORO_SANJI = 'ST12-001';
const rest = (n: number) => Array.from({ length: n }, () => SB.mohji);

/** p2 attacks p1's Leader with Thatch (8000); p1 holds Concasser and `trashed` is p1's trash. */
function underAttack(trashed: string[], p2Trash: string[] = []): TestGame {
  const g = theirs(
    LB.croc,
    { hand: [CONCASSER], trash: trashed, costArea: { active: 3, rested: 0 } },
    { characters: [SB.thatch], trash: p2Trash },
  );
  attack(g, g.find('p2', 'characters', SB.thatch), g.leader('p1'));
  passBlock(g);
  return g;
}

describe('OP12-059 Concasser: [Main] [Sanji] draws 1; [Counter] with 4+ Events in trash, Leader +4000', () => {
  it('[Main] with the [Sanji] Leader draws 1 card and costs 1 DON!!', () => {
    const g = mine(LB.sanji, { hand: [CONCASSER], deck: [SB.marco, ...rest(14)] });
    cast(g, CONCASSER);
    expect(hand(g)).toEqual([SB.marco]);
    expect(deck(g)).toHaveLength(14);
    expect(trash(g)).toEqual([CONCASSER]);
    expect(don(g).active).toBe(9);
  });

  it('[Main] also works with the other [Sanji] Leader (OP12-041)', () => {
    const g = mine(LB.sanjiDon, { hand: [CONCASSER], deck: [SB.marco, ...rest(14)] });
    cast(g, CONCASSER);
    expect(hand(g)).toEqual([SB.marco]);
  });

  it('must not: with a Leader that is not [Sanji] nothing is drawn', () => {
    const g = mine(LB.croc, { hand: [CONCASSER], deck: [SB.marco, ...rest(14)] });
    cast(g, CONCASSER);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('must not: a Leader named "Roronoa Zoro & Sanji" is not [Sanji]: no draw', () => {
    const g = mine(ZORO_SANJI, { hand: [CONCASSER], deck: [SB.marco, ...rest(14)] });
    cast(g, CONCASSER);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('[Counter] with 4 Events in trash after playing it (3 others + itself): Leader gains +4000', () => {
    const g = underAttack([EV, EV, EV]);
    activateCounter(g, g.find('p1', 'hand', CONCASSER));
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: 2 other Events (3 with itself) is not enough: no boost, the attack lands', () => {
    const g = underAttack([EV, EV]);
    activateCounter(g, g.find('p1', 'hand', CONCASSER));
    if (kind(g) === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('more than 4 Events still give exactly +4000, not more', () => {
    const g = underAttack([EV, EV, EV, EV, EV]);
    activateCounter(g, g.find('p1', 'hand', CONCASSER));
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('only Event cards count: 3 Characters + 1 Event in trash do not make 4 Events', () => {
    const g = underAttack([EV, SB.sai, SB.sai, SB.sai, SB.sai]);
    activateCounter(g, g.find('p1', 'hand', CONCASSER));
    if (kind(g) === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("only my own trash counts: 3 Events in the opponent's trash do not help", () => {
    const g = underAttack([], [EV, EV, EV, EV]);
    activateCounter(g, g.find('p1', 'hand', CONCASSER));
    if (kind(g) === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost is to the Leader only, and lasts only this battle', () => {
    const g = theirs(
      LB.croc,
      {
        hand: [CONCASSER],
        trash: [EV, EV, EV],
        characters: [{ card: SB.hajrudin, rested: true }],
        costArea: { active: 3, rested: 0 },
      },
      { characters: [SB.thatch] },
    );
    attack(g, g.find('p2', 'characters', SB.thatch), g.leader('p1'));
    passBlock(g);
    activateCounter(g, g.find('p1', 'hand', CONCASSER));
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(g.power(g.find('p1', 'characters', SB.hajrudin))).toBe(6000);
    act(g, { type: 'endCounter' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(chars(g)).toEqual([SB.hajrudin]);
  });
});
