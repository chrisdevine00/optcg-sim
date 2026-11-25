/**
 * OP11-088 Shu (Black Character, cost 4, 5000, Counter +1000, {Navy}, attribute Special).
 *
 * Card text: "[Blocker] ... [Once Per Turn] This effect can be activated when your opponent's
 * Character attacks. If that Character has the <Slash> attribute, this Character gains +5000 power
 * during this battle."
 *
 * Rules: it triggers on the opponent's attack declaration (before the Block Step) and only when the
 * attacker is a Character (a Leader attack never offers it). A "this effect can be activated" auto
 * is optional (declining keeps the Once Per Turn). The Slash check is the effect's own "If": a
 * non-Slash attacker gives nothing. +5000 lasts for the battle only. An attacker wins a tie
 * (CR 7-1-4-1: attacker's power >= the defender's), so Shu at 10000 loses to an attacker of 10000.
 *
 * Open question (M6b-Q89): whether a non-Slash Character's attack offers the prompt and whether
 * using it there spends the Once Per Turn. Those tests assert only what every reading shares (the
 * power does not change), with the prompt answered when it appears.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock, passCounter } from '../../helpers.ts';
import {
  answerOptional,
  at,
  atMain,
  blockers,
  LD14,
  mine,
  need,
  pendingKind,
  pwr,
  SC14,
  settleOrders,
  theirs,
} from './kit-lfd.ts';

const SHU = 'OP11-088';
/** OP02-043: Slash, cost 4, 6000, no text. */
const SLASH6 = 'OP02-043';
/** OP02-055: Slash, cost 6, 8000, no text. */
const SLASH8 = 'OP02-055';
/** OP12-055: Slash/Wisdom, cost 5, 6000, no text. */
const SLASH_WISDOM = 'OP12-055';
/** OP01-018 Hajrudin: Strike, cost 4, 6000, no text. */
const STRIKE6 = SC14.c4;
/** OP02-084: Slash, cost 1, 3000, no text. */
const SLASH3 = 'OP02-084';
/** OP01-001 Roronoa Zoro: Slash Leader, 5000. His boost needs a given DON!!: none here. */
const ZORO = 'OP01-001';

/** p2's turn: p1 holds `shu` Shu on the field; p2 has `p2chars`. */
function def(p2chars: (string | { card: string; don?: number; rested?: boolean })[], shu = 1) {
  const given = p2chars.reduce((n, c) => n + (typeof c === 'string' ? 0 : (c.don ?? 0)), 0);
  return theirs(
    LD14.neutral,
    { characters: Array.from({ length: shu }, () => SHU) },
    { characters: p2chars, costArea: { active: 10 - given, rested: 0 } },
  );
}

function hitLeaderWith(g: ReturnType<typeof def>, attacker: string, nth = 0) {
  attack(g, at(g, 'p2', 'characters', attacker, nth), g.leader('p1'));
}

describe('OP11-088 Shu: [Once Per Turn] when the opponent’s Character attacks: if it has <Slash>, +5000 power during this battle', () => {
  it('a Slash Character attacks: the effect is offered, and on use Shu has 10000 power', () => {
    const g = def([SLASH6]);
    hitLeaderWith(g, SLASH6);
    need(g, 'optional', 'p1');
    answerOptional(g, true);
    need(g, 'block', 'p1');
    expect(pwr(g, at(g, 'p1', 'characters', SHU))).toBe(10000);
  });

  it('Shu blocks a 9000 Slash attacker (6000 + 3 DON!!) and survives at 10000', () => {
    const g = def([{ card: SLASH6, don: 3 }]);
    hitLeaderWith(g, SLASH6);
    answerOptional(g, true);
    const shu = at(g, 'p1', 'characters', SHU);
    expect(blockers(g)).toEqual([shu]);
    act(g, { type: 'block', blocker: shu });
    passCounter(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SHU]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).not.toContain(SHU);
  });

  it('boundary: a 10000 Slash attacker ties Shu at 10000 and the attacker wins, so Shu is K.O.’d', () => {
    const g = def([{ card: SLASH6, don: 4 }]);
    hitLeaderWith(g, SLASH6);
    answerOptional(g, true);
    expect(pwr(g, at(g, 'p2', 'characters', SLASH6))).toBe(10000);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', SHU) });
    passCounter(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([SHU]);
  });

  it('control: declining the effect, the same 9000 Slash attacker K.O.’s a blocking Shu', () => {
    const g = def([{ card: SLASH6, don: 3 }]);
    hitLeaderWith(g, SLASH6);
    answerOptional(g, false);
    expect(pwr(g, at(g, 'p1', 'characters', SHU))).toBe(5000);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', SHU) });
    passCounter(g);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([SHU]);
  });

  it('a rested Shu attacked directly by a 6000 Slash Character survives with +5000', () => {
    const g = theirs(
      LD14.neutral,
      { characters: [{ card: SHU, rested: true }] },
      { characters: [SLASH6] },
    );
    attack(g, at(g, 'p2', 'characters', SLASH6), at(g, 'p1', 'characters', SHU));
    answerOptional(g, true);
    passBlock(g);
    passCounter(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SHU]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SLASH6]);
  });

  it('a Slash/Wisdom Character (two attributes) has the <Slash> attribute', () => {
    const g = def([SLASH_WISDOM]);
    hitLeaderWith(g, SLASH_WISDOM);
    answerOptional(g, true);
    expect(pwr(g, at(g, 'p1', 'characters', SHU))).toBe(10000);
  });

  it('a Strike Character attacks: Shu gets no power, whether or not the prompt is used', () => {
    for (const use of [true, false]) {
      const g = def([STRIKE6]);
      hitLeaderWith(g, STRIKE6);
      if (pendingKind(g) === 'optional') answerOptional(g, use);
      need(g, 'block', 'p1');
      expect(pwr(g, at(g, 'p1', 'characters', SHU))).toBe(5000);
    }
  });

  it('must not happen: a Slash LEADER attacking is not "a Character": no prompt, no power', () => {
    const g = theirs(LD14.neutral, { characters: [SHU] }, {}, ZORO);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(pendingKind(g)).toBe('block');
    expect(pwr(g, at(g, 'p1', 'characters', SHU))).toBe(5000);
  });

  it('the boost lasts for the battle only: after an unblocked hit Shu is back to 5000', () => {
    const g = def([SLASH6]);
    hitLeaderWith(g, SLASH6);
    answerOptional(g, true);
    passBlock(g);
    passCounter(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(pwr(g, at(g, 'p1', 'characters', SHU))).toBe(5000);
  });

  it('Once Per Turn: the second Slash attacker of the turn offers nothing and Shu stays 5000', () => {
    const g = def([SLASH6, SLASH3]);
    hitLeaderWith(g, SLASH6);
    answerOptional(g, true);
    passBlock(g);
    passCounter(g);
    expect(atMain(g, 'p2')).toBe(true);
    hitLeaderWith(g, SLASH3);
    expect(pendingKind(g)).toBe('block');
    expect(pwr(g, at(g, 'p1', 'characters', SHU))).toBe(5000);
  });

  it('declining keeps the Once Per Turn: the next Slash attacker of the turn is offered it again', () => {
    const g = def([SLASH6, SLASH3]);
    hitLeaderWith(g, SLASH6);
    answerOptional(g, false);
    passBlock(g);
    passCounter(g);
    hitLeaderWith(g, SLASH3);
    need(g, 'optional', 'p1');
    answerOptional(g, true);
    expect(pwr(g, at(g, 'p1', 'characters', SHU))).toBe(10000);
  });

  it('two Shus each have their own Once Per Turn: both reach 10000 against one Slash attacker', () => {
    const g = def([SLASH8], 2);
    hitLeaderWith(g, SLASH8);
    for (let i = 0; i < 2; i++) {
      settleOrders(g);
      answerOptional(g, true);
    }
    need(g, 'block', 'p1');
    const shus = g.zone('p1', 'characters').map((c) => c.instance);
    expect(shus.map((s) => pwr(g, s))).toEqual([10000, 10000]);
  });

  it('only the opponent’s attacks count: my own Slash attacker on my turn offers me nothing', () => {
    const g = mine(LD14.neutral, { characters: [SHU, SLASH6] }, {});
    attack(g, at(g, 'p1', 'characters', SLASH6), g.leader('p2'));
    expect(pendingKind(g)).not.toBe('optional');
    expect(pwr(g, at(g, 'p1', 'characters', SHU))).toBe(5000);
  });

  it('Blocker: without the boost (Strike attacker) Shu may block and is K.O.’d by 6000', () => {
    const g = def([STRIKE6]);
    hitLeaderWith(g, STRIKE6);
    if (pendingKind(g) === 'optional') answerOptional(g, false);
    const shu = at(g, 'p1', 'characters', SHU);
    expect(blockers(g)).toEqual([shu]);
    act(g, { type: 'block', blocker: shu });
    passCounter(g);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([SHU]);
  });
});
