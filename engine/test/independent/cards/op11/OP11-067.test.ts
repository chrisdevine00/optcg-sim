/**
 * OP11-067 Charlotte Katakuri (Purple Character, cost 8, 8000, no Counter, {Big Mom Pirates},
 * [Blocker]).
 *
 * Card text: "[Blocker] [End of Your Turn] Set up to 2 of your {Big Mom Pirates} type Characters with a
 * cost of 3 or more as active. Then, add up to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules: up to 2 (0, 1 or 2) of my {Big Mom Pirates} Characters with cost 3 or more, Katakuri
 * included; they stand up (they can block on the opponent's turn). The DON!! comes in rested. It
 * fires at the end of MY turn only.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  C11,
  choices,
  donCountOptions,
  donOf,
  isRested,
  kind,
  L11,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  takeDon,
  theirs,
  act,
  decision,
} from './kit-op11b.ts';

const KATAKURI = 'OP11-067';

/** Katakuri and four more rested Characters; p1 ends the turn. */
function ending(o: { active?: number } = {}) {
  const g = mine(L11.bmp, {
    characters: [
      { card: KATAKURI, rested: true },
      { card: C11.bmpP5, rested: true },
      { card: C11.bmpY4, rested: true },
      { card: C11.bmpY2, rested: true },
      { card: C11.c3, rested: true },
    ],
    costArea: { active: o.active ?? 5, rested: 0 },
  });
  act(g, { type: 'endTurn' });
  return g;
}

describe('OP11-067 Charlotte Katakuri: [End of Your Turn] set up to 2 {Big Mom Pirates} Characters (cost 3+) active, then add 1 rested DON!!', () => {
  it('offers exactly my {Big Mom Pirates} Characters with cost 3 or more (cost 2 and other types are out), Katakuri included', () => {
    const g = ending();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KATAKURI, C11.bmpP5, C11.bmpY4].sort());
  });

  it('two chosen Characters are set active; the others stay rested', () => {
    const g = ending();
    pickInst(g, [at(g, 'p1', 'characters', C11.bmpP5), at(g, 'p1', 'characters', C11.bmpY4)]);
    expect(isRested(g, at(g, 'p1', 'characters', C11.bmpP5))).toBe(false);
    expect(isRested(g, at(g, 'p1', 'characters', C11.bmpY4))).toBe(false);
    expect(isRested(g, at(g, 'p1', 'characters', KATAKURI))).toBe(true);
    expect(isRested(g, at(g, 'p1', 'characters', C11.bmpY2))).toBe(true);
    expect(isRested(g, at(g, 'p1', 'characters', C11.c3))).toBe(true);
  });

  it('Katakuri himself may be one of the two', () => {
    const g = ending();
    pickInst(g, [at(g, 'p1', 'characters', KATAKURI)]);
    need(g, 'choose', 'p1');
    expect(isRested(g, at(g, 'p1', 'characters', KATAKURI))).toBe(false);
  });

  it('at most 2: after two picks the third is no longer offered and the effect moves on to the DON!! count', () => {
    const g = ending();
    pickInst(g, [at(g, 'p1', 'characters', C11.bmpP5), at(g, 'p1', 'characters', C11.bmpY4)]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([]);
    expect(donCountOptions(g).sort()).toEqual(['0', '1']);
    expect(isRested(g, at(g, 'p1', 'characters', KATAKURI))).toBe(true);
  });

  it('"up to 2": choosing only 1, or none, is allowed', () => {
    const g = ending();
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', C11.bmpP5)]);
    expect(isRested(g, at(g, 'p1', 'characters', C11.bmpP5))).toBe(false);
    expect(isRested(g, at(g, 'p1', 'characters', C11.bmpY4))).toBe(true);
    const h = ending();
    need(h, 'choose', 'p1');
    none(h);
    expect(isRested(h, at(h, 'p1', 'characters', C11.bmpP5))).toBe(true);
  });

  it('then adds 1 DON!! from the DON!! deck, and it is RESTED', () => {
    const g = ending();
    pickInst(g, [at(g, 'p1', 'characters', C11.bmpP5)]);
    takeDon(g, 1);
    const d = donOf(g, 'p1');
    expect(d.deck).toBe(4);
    expect(d.rested).toBe(1);
    expect(d.active).toBe(5);
    expect(decision(g)?.player).toBe('p2');
  });

  it('"up to 1": answering 0 adds no DON!!', () => {
    const g = ending();
    pickInst(g, [at(g, 'p1', 'characters', C11.bmpP5)]);
    takeDon(g, 0);
    expect(donOf(g, 'p1').deck).toBe(5);
    expect(decision(g)?.player).toBe('p2');
  });

  it('with an empty DON!! deck the Characters are still set active and no DON!! comes', () => {
    const g = ending({ active: 10 });
    pickInst(g, [at(g, 'p1', 'characters', C11.bmpP5)]);
    if (kind(g) === 'choose' && decision(g)?.purpose === 'mode') takeDon(g, 0);
    expect(isRested(g, at(g, 'p1', 'characters', C11.bmpP5))).toBe(false);
    expect(donOf(g, 'p1').deck).toBe(0);
  });

  it('Katakuri set active by his own effect can block on the opponent turn; left rested he cannot', () => {
    const g = ending();
    pickInst(g, [at(g, 'p1', 'characters', KATAKURI)]);
    takeDon(g, 0);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(g.card(at(g, 'p1', 'characters', KATAKURI)).keywords).toContain('Blocker');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', KATAKURI)]);

    const h = ending();
    pickInst(h, [at(h, 'p1', 'characters', C11.bmpP5)]);
    takeDon(h, 0);
    attack(h, h.leader('p2'), h.leader('p1'));
    expect(blockers(h)).toEqual([]);
  });

  it('it does not fire at the end of the opponent turn', () => {
    const g = theirs(
      L11.bmp,
      {
        characters: [
          { card: KATAKURI, rested: true },
          { card: C11.bmpP5, rested: true },
        ],
      },
      {},
    );
    act(g, { type: 'endTurn' });
    expect(decision(g)?.player).toBe('p1');
    expect(kind(g)).toBe('main');
    expect(g.events.some((e) => e.type === 'ModeChosen')).toBe(false);
  });
});
