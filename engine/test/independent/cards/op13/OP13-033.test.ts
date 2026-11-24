/**
 * OP13-033 Franky (Character, Green, cost 3, 5000, no Counter, {FILM}/{Straw Hat Crew}).
 *
 * Card text: "[On K.O.] Rest up to 2 of your opponent's cards."
 *
 * Rules: CR 10-2-1 / digest 109 ("trash" and "place at the bottom" are not a K.O.), CR 8-4-4-1
 * ("up to"). Whether a DON!! card is a "card" for this effect is not asked: nothing here asserts it.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  choices,
  decision,
  kind,
  need,
  noDefence,
  offeredIds,
  opponentKOs,
  pickInst,
  playRaw,
  SC2,
  theirs,
  WL,
  WV,
  isMain,
  mine,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const FRANKY = 'OP13-033';

/** p2's turn: p1 has a rested Franky; p2 has Thatch (attacker, 8000), Sai and Marco, all active. */
function board(extra: string[] = [WV.sai, WV.marco], p2hand: string[] = []): TestGame {
  return theirs(
    WL.croc,
    { characters: [{ card: FRANKY, rested: true }] },
    { characters: [WV.thatch, ...extra], hand: p2hand },
  );
}

/** Thatch attacks Franky; p1 does not block or counter: Franky is K.O.'d. */
function koFranky(g: TestGame): void {
  attack(g, g.find('p2', 'characters', WV.thatch), g.find('p1', 'characters', FRANKY));
  noDefence(g);
}

describe('OP13-033 Franky: [On K.O.] rest up to 2 of the opponent cards', () => {
  it("K.O.'d in battle: asks for up to 2 targets; two Characters are rested", () => {
    const g = board();
    koFranky(g);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([FRANKY]);
    need(g, 'choose', 'p1');
    expect(decision(g)?.max).toBe(2);
    pickInst(g, [g.find('p2', 'characters', WV.sai), g.find('p2', 'characters', WV.marco)]);
    expect(g.card(g.find('p2', 'characters', WV.sai)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', WV.marco)).rested).toBe(true);
    expect(kind(g)).toBe('main');
  });

  it('"up to": one target rests one card only; the other stays active', () => {
    const g = board();
    koFranky(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', WV.sai)]);
    expect(g.card(g.find('p2', 'characters', WV.sai)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', WV.marco)).rested).toBe(false);
  });

  it('"up to": choosing nothing rests nothing', () => {
    const g = board();
    koFranky(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(g.card(g.find('p2', 'characters', WV.sai)).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', WV.marco)).rested).toBe(false);
  });

  it('three candidates: no selection of three is possible (at most 2)', () => {
    const g = board([WV.sai, WV.marco, WV.jil]);
    koFranky(g);
    need(g, 'choose', 'p1');
    const [a, b, c] = [WV.sai, WV.marco, WV.jil].map((x) => g.find('p2', 'characters', x));
    act(g, { type: 'pick', choice: [a!, b!, c!].sort()[0]! });
    act(g, { type: 'pick', choice: [a!, b!, c!].sort()[1]! });
    // after two picks the decision is over: no third pick is legal
    expect(g.legal().filter((x) => x.type === 'pick')).toEqual([]);
  });

  it('the opponent Leader is a legal target', () => {
    const g = board();
    koFranky(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p2'));
    pickInst(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).rested).toBe(true);
  });

  it('my own cards are never offered', () => {
    const g = theirs(
      WL.croc,
      { characters: [{ card: FRANKY, rested: true }, WV.mohji] },
      { characters: [WV.thatch, WV.sai] },
    );
    koFranky(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.find('p1', 'characters', WV.mohji));
    expect(offeredIds(g).filter((c) => c === WV.mohji)).toEqual([]);
  });

  it("K.O.'d by an opponent effect also triggers it", () => {
    const g = theirs(
      WL.croc,
      { characters: [FRANKY] },
      { characters: [WV.sai], hand: [SC2.lightning] },
    );
    opponentKOs(g, g.find('p1', 'characters', FRANKY));
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', WV.sai)]);
    expect(g.card(g.find('p2', 'characters', WV.sai)).rested).toBe(true);
  });

  it('must not happen: trashed for the 5-Character limit (not a K.O.) does not trigger it', () => {
    const g = mine(
      WL.croc,
      { hand: [WV.mohji], characters: [FRANKY, WV.marco, WV.sai, WV.jil, WV.kingdew] },
      { characters: [WV.sai] },
    );
    playRaw(g, WV.mohji);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', FRANKY)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([FRANKY]);
    expect(isMain(g)).toBe(true);
    expect(g.card(g.find('p2', 'characters', WV.sai)).rested).toBe(false);
  });

  it('with the opponent having nothing active to rest, a K.O. still resolves without error', () => {
    const g = theirs(
      WL.croc,
      { characters: [{ card: FRANKY, rested: true }] },
      { characters: [WV.thatch] },
    );
    koFranky(g);
    // the only candidates are the Leader and the rested Thatch; finishing with nothing is allowed
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('playing Franky has no effect of its own (no prompt)', () => {
    const g = mine(WL.croc, { hand: [FRANKY] }, { characters: [WV.sai] });
    playRaw(g, FRANKY);
    expect(isMain(g)).toBe(true);
    expect(g.power(g.find('p1', 'characters', FRANKY))).toBe(5000);
  });
});
