/**
 * OP13-042 Edward.Newgate (Character, Blue, cost 10, 12000, no Counter, [Blocker], {The Four
 * Emperors}/{Whitebeard Pirates}).
 *
 * Card text: "[Blocker]
 * [On Play] Draw 2 cards and trash 1 card from your hand. Then, give your Leader and 1 Character
 * up to 2 rested DON!! cards each."
 *
 * Rules: CR 8-1-2 (mandatory), RL-26 (deck-out), digest 55 (only rested cost-area DON!! can be
 * given; "up to 2 each" is per target), given DON!! give +1000 each on my turn.
 *
 * API gap: Newgate costs all 10 DON!!, so no scenario leaves fewer than 10 rested DON!! when the
 * effect runs; the "fewer than 2 rested" boundary cannot be reached (API-GAPS-b.md).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  BLUE,
  choices,
  decision,
  dons,
  handOf,
  isMain,
  mine,
  need,
  optionLabels,
  pickInst,
  pickOption,
  playRaw,
  result,
  WL,
  WV,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import type { InstanceId } from '@optcg/engine';

const NEWGATE = 'OP13-042';
const TWO = '2 DON!!';
const ONE = '1 DON!!';

function board(chars: string[] = [WV.thatch], hand: string[] = [WV.mohji, WV.komachiyo]): TestGame {
  return mine(WL.ace, {
    hand: [NEWGATE, ...hand],
    deck: [WV.marco, WV.sai, BLUE, BLUE, BLUE, BLUE],
    characters: chars,
  });
}

/** Play Newgate and trash `trash` (a card id in hand). Leaves the Character pick pending. */
function toCharPick(g: TestGame, trash: string): void {
  playRaw(g, NEWGATE);
  need(g, 'choose', 'p1');
  pickInst(g, [g.find('p1', 'hand', trash)]);
}

/** Run the whole effect: trash `trash`, give the Leader `l` and `char` the count `c`. */
function run(g: TestGame, trash: string, char: InstanceId, l: string, c: string): void {
  toCharPick(g, trash);
  need(g, 'choose', 'p1');
  pickInst(g, [char]);
  pickOption(g, l);
  if (!isMain(g)) pickOption(g, c);
}

describe('OP13-042 Edward.Newgate: [Blocker]; [On Play] draw 2, trash 1, give Leader and a Character up to 2 rested DON!!', () => {
  it('has [Blocker], 12000 power and cost 10', () => {
    const g = board();
    playRaw(g, NEWGATE);
    const n = g.find('p1', 'characters', NEWGATE);
    expect(g.card(n).keywords).toContain('Blocker');
    expect(g.power(n)).toBe(12000);
    expect(dons(g).rested).toBe(10);
  });

  it('draws 2 first, then asks to trash exactly 1 card: the drawn cards are candidates too', () => {
    const g = board();
    playRaw(g, NEWGATE);
    const d = need(g, 'choose', 'p1');
    expect(d.min).toBe(1);
    expect(d.max).toBe(1);
    const ids = choices(g).map((i) => g.card(i).card);
    expect(ids.sort()).toEqual([WV.marco, WV.sai, WV.mohji, WV.komachiyo].sort());
  });

  it('trashing a just-drawn card is allowed and the hand ends with 3 cards', () => {
    const g = board();
    toCharPick(g, WV.marco);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([WV.marco]);
    expect(handOf(g)).toEqual([WV.mohji, WV.komachiyo, WV.sai].sort());
  });

  it('the Character to give to: my Characters only, Newgate himself included', () => {
    const g = board([WV.thatch]);
    toCharPick(g, WV.mohji);
    need(g, 'choose', 'p1');
    const offered = choices(g).map((i) => g.card(i).card);
    expect(offered.sort()).toEqual([NEWGATE, WV.thatch].sort());
    for (const i of choices(g)) expect(g.card(i).owner).toBe('p1');
  });

  it('gives the Leader 2 and the chosen Character 2 rested DON!!', () => {
    const g = board();
    const thatch = g.find('p1', 'characters', WV.thatch);
    run(g, WV.mohji, thatch, TWO, TWO);
    expect(isMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(g.card(thatch).don).toBe(2);
    expect(dons(g)).toMatchObject({ rested: 6, given: 4 });
  });

  it('"up to 2": the Leader may get 1, and the Character a different amount', () => {
    const g = board();
    const thatch = g.find('p1', 'characters', WV.thatch);
    toCharPick(g, WV.mohji);
    pickInst(g, [thatch]);
    expect(optionLabels(g).sort()).toContain(ONE);
    pickOption(g, ONE);
    if (!isMain(g)) pickOption(g, TWO);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.card(thatch).don).toBe(2);
  });

  it('the given DON!! add +1000 each: Leader 5000 -> 7000, Thatch 8000 -> 10000', () => {
    const g = board();
    const thatch = g.find('p1', 'characters', WV.thatch);
    run(g, WV.mohji, thatch, TWO, TWO);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(thatch)).toBe(10000);
  });

  it('Newgate may give to himself as the 1 Character', () => {
    const g = board([]);
    const n = g.find('p1', 'hand', NEWGATE);
    void n;
    playRaw(g, NEWGATE);
    pickInst(g, [g.find('p1', 'hand', WV.mohji)]);
    // the only Character is Newgate: the pick may be forced; otherwise choose him
    if (
      decision(g)?.kind === 'choose' &&
      choices(g).length > 0 &&
      decision(g)?.options === undefined
    ) {
      pickInst(g, [g.find('p1', 'characters', NEWGATE)]);
    }
    pickOption(g, TWO);
    if (!isMain(g)) pickOption(g, TWO);
    expect(g.card(g.find('p1', 'characters', NEWGATE)).don).toBe(2);
    expect(g.card(g.leader('p1')).don).toBe(2);
  });

  it('the opponent cards are never offered and nothing is given to them', () => {
    const g = mine(
      WL.ace,
      { hand: [NEWGATE, WV.mohji], deck: [BLUE, BLUE, BLUE, BLUE] },
      { characters: [WV.sai] },
    );
    toCharPick(g, WV.mohji);
    need(g, 'choose', 'p1');
    for (const i of choices(g)) expect(g.card(i).owner).toBe('p1');
    expect(g.card(g.find('p2', 'characters', WV.sai)).don).toBe(0);
  });

  it('deck-out: with 1 card in the deck, drawing 2 empties it and I lose (RL-26)', () => {
    const g = mine(WL.ace, { hand: [NEWGATE, WV.mohji], deck: [BLUE] });
    playRaw(g, NEWGATE);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('declining nothing: the first prompt is the mandatory trash (no "up to" and no skip)', () => {
    const g = board();
    playRaw(g, NEWGATE);
    need(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    void act;
  });
});
