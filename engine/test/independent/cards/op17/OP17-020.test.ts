/**
 * OP17-020 Shanks (Leader, Green, 5000, 5 Life, {The Four Emperors}/{Red-Haired Pirates}, Slash).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may trash 1 card from your hand or rest 1 of your
 * DON!! cards: Up to 1 of your opponent's rested Characters will not become active in your
 * opponent's next Refresh Phase."
 *
 * Rules: CR 10-2-2 ([Activate: Main]), CR 10-2-13 ([Once Per Turn]), CR 8-3-1-3 (a cost that cannot
 * be paid), CR 8-4-4-1 ("up to"), CR 6-2-4 (Refresh sets rested cards active), CR 7-1-1-2 / RL-17 (the
 * rested state of Characters).
 */
import { describe, expect, it } from 'vitest';
import {
  abilities,
  canActivate,
  choices,
  choose,
  chooseNone,
  decision,
  don,
  endTurn,
  expectMain,
  hand,
  isRested,
  kind,
  LD,
  mine,
  payDon,
  pickMode,
  trash,
  VAN,
  WB,
} from './kit-op17a.ts';
import { act } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';

function setup(
  opp: (string | { card: string; rested: boolean })[] = [{ card: WB.thatch, rested: true }],
  p1: { hand?: string[]; costArea?: { active: number; rested: number } } = { hand: [VAN.mohji] },
) {
  return mine(LD.shanks, p1, { characters: opp });
}

/** Activate the Leader and pay the cost the stated way, stopping at the target choice. */
function begin(g: TestGame, how: 'trash' | 'rest') {
  const [ability] = abilities(g, g.leader('p1'));
  if (!ability) throw new Error('not offered');
  act(g, { type: 'activate', card: g.leader('p1'), ability });
  if (kind(g) === 'choose' && decision(g)?.purpose === 'mode')
    pickMode(g, how === 'trash' ? /trash/i : /rest/i);
  if (how === 'rest') payDon(g, 1);
  else if (kind(g) === 'choose' && decision(g)?.purpose === 'cost') {
    const hit = g.legal().find((a) => a.type === 'pick');
    if (hit) g.act(hit);
  }
}

describe('OP17-020 Shanks: [Activate: Main] [Once Per Turn] trash 1 or rest 1 DON!!: a rested opposing Character will not become active in the next Refresh Phase', () => {
  it('paying with a rested DON!!: the chosen rested Character stays rested through the opponent’s Refresh, another rested one untaps', () => {
    const g = setup([
      { card: WB.thatch, rested: true },
      { card: WB.kingdew, rested: true },
    ]);
    begin(g, 'rest');
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expectMain(g);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
    expect(hand(g)).toEqual([VAN.mohji]);
    endTurn(g);
    expect(isRested(g, 'p2', WB.thatch)).toBe(true);
    expect(isRested(g, 'p2', WB.kingdew)).toBe(false);
  });

  it('paying by trashing a card from hand works too (and rests no DON!!)', () => {
    const g = setup();
    begin(g, 'trash');
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([VAN.mohji]);
    expect(don(g)).toMatchObject({ active: 10, rested: 0 });
    endTurn(g);
    expect(isRested(g, 'p2', WB.thatch)).toBe(true);
  });

  it('only RESTED opposing Characters are candidates', () => {
    const g = setup([{ card: WB.thatch, rested: true }, WB.kingdew]);
    begin(g, 'rest');
    expect(choices(g)).toEqual([g.find('p2', 'characters', WB.thatch)]);
  });

  it('CR 8-4-4-1 "up to 1": the cost is paid and nobody need be chosen; then the Character untaps normally', () => {
    const g = setup();
    begin(g, 'rest');
    chooseNone(g);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
    endTurn(g);
    expect(isRested(g, 'p2', WB.thatch)).toBe(false);
  });

  it('only the NEXT Refresh Phase: the Character untaps in the opponent’s following Refresh', () => {
    const g = setup();
    begin(g, 'rest');
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    endTurn(g);
    expect(isRested(g, 'p2', WB.thatch)).toBe(true);
    endTurn(g);
    endTurn(g);
    expectMain(g, 'p2');
    expect(isRested(g, 'p2', WB.thatch)).toBe(false);
  });

  it('CR 10-2-13: [Once Per Turn]: not offered a second time in the same turn', () => {
    const g = setup([
      { card: WB.thatch, rested: true },
      { card: WB.kingdew, rested: true },
    ]);
    begin(g, 'rest');
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expect(canActivate(g, g.leader('p1'))).toBe(false);
  });

  it('CR 8-3-1-3: with no card in hand and no active DON!! the cost cannot be paid: not offered', () => {
    const g = setup(undefined, { hand: [], costArea: { active: 0, rested: 10 } });
    expect(canActivate(g, g.leader('p1'))).toBe(false);
  });

  it('with an empty hand the DON!! way is still available', () => {
    const g = setup(undefined, { hand: [] });
    expect(canActivate(g, g.leader('p1'))).toBe(true);
    begin(g, 'rest');
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    endTurn(g);
    expect(isRested(g, 'p2', WB.thatch)).toBe(true);
  });

  it('with every DON!! rested the trash way is still available', () => {
    const g = setup(undefined, { hand: [VAN.mohji], costArea: { active: 0, rested: 10 } });
    expect(canActivate(g, g.leader('p1'))).toBe(true);
    begin(g, 'trash');
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expect(hand(g)).toEqual([]);
  });

  it('it affects only the chosen Character: the opposing Leader and active Characters are not candidates', () => {
    const g = setup([{ card: WB.thatch, rested: true }, WB.kingdew]);
    begin(g, 'trash');
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.find('p2', 'characters', WB.kingdew));
  });
});
