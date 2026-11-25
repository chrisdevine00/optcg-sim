/**
 * OP10-053 Bian (Character, Blue, cost 1, 1000, Counter +1000, {Dressrosa}/{The Tontattas}).
 *
 * Card text: "If you have a "The Tontattas" type Character other than [Bian], this Character gains
 * [Blocker]."
 *
 * Rules: permanent effect checked continuously (CR 8-3-1), "you have" means my own field, "other than
 * [Bian]" excludes every card named Bian, [Blocker] (CR 10-1-4).
 * Scenery: OP10-044 Cub ({The Tontattas}, cost 1, 2000), OP01-023 Marco (not a Tontattas),
 * OP09-077 Gum-Gum Lightning (opposing K.O.).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  block,
  blockers,
  C10,
  inst,
  kw,
  L10,
  mine,
  need,
  opponentKOs,
  playRaw,
  theirs,
  X10,
  zoneIds,
} from './kit-op10b.ts';

const BIAN = 'OP10-053';
const CUB = X10.cub;
const R = (card: string) => ({ card, rested: true });
const hasBlocker = (g: ReturnType<typeof mine>, who: 'p1' | 'p2', card: string, nth = 0) =>
  kw(g, inst(g, who, 'characters', card, nth)).includes('Blocker');

describe('OP10-053 Bian: gains [Blocker] while I have another {The Tontattas} Character', () => {
  it('with Cub ({The Tontattas}) on my field Bian has [Blocker]', () => {
    const g = mine(L10.luffy, { characters: [BIAN, CUB] });
    expect(hasBlocker(g, 'p1', BIAN)).toBe(true);
  });

  it('alone, Bian has no [Blocker]', () => {
    const g = mine(L10.luffy, { characters: [BIAN] });
    expect(hasBlocker(g, 'p1', BIAN)).toBe(false);
  });

  it('with only a Character of another type (Marco), Bian has no [Blocker]', () => {
    const g = mine(L10.luffy, { characters: [BIAN, C10.marco] });
    expect(hasBlocker(g, 'p1', BIAN)).toBe(false);
  });

  it('"other than [Bian]": a second Bian does not count, so neither has [Blocker]', () => {
    const g = mine(L10.luffy, { characters: [BIAN, BIAN] });
    expect(hasBlocker(g, 'p1', BIAN, 0)).toBe(false);
    expect(hasBlocker(g, 'p1', BIAN, 1)).toBe(false);
  });

  it("only my own Characters count: a {The Tontattas} Character on the opponent's field gives nothing", () => {
    const g = mine(L10.luffy, { characters: [BIAN] }, { characters: [CUB] });
    expect(hasBlocker(g, 'p1', BIAN)).toBe(false);
  });

  it('a rested {The Tontattas} Character still counts', () => {
    const g = mine(L10.luffy, { characters: [BIAN, R(CUB)] });
    expect(hasBlocker(g, 'p1', BIAN)).toBe(true);
  });

  it('the condition is live: playing a {The Tontattas} Character from hand gives [Blocker] at once', () => {
    const g = mine(L10.luffy, { hand: [CUB], characters: [BIAN] });
    expect(hasBlocker(g, 'p1', BIAN)).toBe(false);
    playRaw(g, CUB);
    // Cub's [On Play] asks whether to rest a {Dressrosa} Leader or Stage: not usable here (no such card)
    const d = g.legal().find((a) => a.type === 'optional' && !a.accept);
    if (d) g.act(d);
    expect(hasBlocker(g, 'p1', BIAN)).toBe(true);
  });

  it("[Blocker] works on the opponent's turn: Bian is offered as a blocker and blocks", () => {
    const g = theirs(L10.luffy, { characters: [BIAN, CUB] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toContain(inst(g, 'p1', 'characters', BIAN));
    block(g, inst(g, 'p1', 'characters', BIAN));
    expect(g.life('p1')).toBe(4);
  });

  it('without the {The Tontattas} Character Bian is not offered as a blocker', () => {
    const g = theirs(L10.luffy, { characters: [BIAN, C10.marco] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
  });

  it("the [Blocker] goes when the other {The Tontattas} Character is K.O.'d by an opposing effect", () => {
    const g = theirs(L10.luffy, { characters: [BIAN, CUB] }, { hand: [X10.lightning] });
    expect(hasBlocker(g, 'p1', BIAN)).toBe(true);
    opponentKOs(g, inst(g, 'p1', 'characters', CUB));
    expect(zoneIds(g, 'p1', 'characters')).toEqual([BIAN]);
    expect(hasBlocker(g, 'p1', BIAN)).toBe(false);
  });
});
