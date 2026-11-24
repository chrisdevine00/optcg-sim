/**
 * ST30-010 Crocodile (Character, Green, cost 6, 6000, Counter +1000, {Impel Down}/{Former Baroque Works}).
 *
 * Card text: "[Blocker] [On Play] Up to 1 of your opponent's rested Characters will not become
 * active in your opponent's next Refresh Phase."
 *
 * Rules: "up to 1" allows 0 (CR 8-4-4-1), only rested Characters qualify, the Refresh Phase sets
 * rested cards active (CR 6-2-4) and this effect lasts for the next one only; DON!! cards are not
 * Characters.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  choices,
  kind,
  kw,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playCardRaw,
  SL,
  don,
} from './kit-stb5a.ts';

const ID = 'ST30-010';
const KING = 'OP02-006'; // Red, 7000
const MARCO = 'OP01-023'; // Red, 5000
const SAI = 'OP01-012'; // Red, 4000

type P2 = (string | { card: string; rested?: boolean })[];

function played(p2chars: P2, p2extra: Record<string, unknown> = {}) {
  const g = mine(SL.croc, { hand: [ID] }, { characters: p2chars, ...p2extra });
  playCardRaw(g, ID);
  return g;
}
const restedOf = (g: ReturnType<typeof played>, card: string) =>
  g.zone('p2', 'characters').find((c) => c.card === card)!.rested;

describe('ST30-010 Crocodile: [Blocker]', () => {
  it('has [Blocker]', () => {
    const g = mine(SL.croc, { characters: [ID] });
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Blocker');
  });
});

describe('ST30-010 Crocodile: [On Play] up to 1 rested opposing Character stays rested in the next Refresh Phase', () => {
  it("offers only the opponent's rested Characters (not active ones, not mine)", () => {
    const g = mine(
      SL.croc,
      { hand: [ID], characters: [{ card: SAI, rested: true }] },
      { characters: [{ card: KING, rested: true }, MARCO] },
    );
    playCardRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KING]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it("the chosen Character is still rested after the opponent's Refresh Phase; an unchosen rested one is active", () => {
    const g = played([
      { card: KING, rested: true },
      { card: MARCO, rested: true },
    ]);
    pickInst(g, [g.find('p2', 'characters', KING)]);
    act(g, { type: 'endTurn' });
    expect(kind(g)).toBe('main');
    expect(restedOf(g, KING)).toBe(true);
    expect(restedOf(g, MARCO)).toBe(false);
  });

  it('"up to 1": choosing nothing lets everything become active', () => {
    const g = played([{ card: KING, rested: true }]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    act(g, { type: 'endTurn' });
    expect(restedOf(g, KING)).toBe(false);
  });

  it('only one Character is held even with two rested candidates', () => {
    const g = played([
      { card: KING, rested: true },
      { card: MARCO, rested: true },
    ]);
    pickInst(g, [g.find('p2', 'characters', MARCO)]);
    act(g, { type: 'endTurn' });
    expect(restedOf(g, MARCO)).toBe(true);
    expect(restedOf(g, KING)).toBe(false);
  });

  it('lasts for the next Refresh Phase only: the Character becomes active in the one after', () => {
    const g = played([{ card: KING, rested: true }]);
    pickInst(g, [g.find('p2', 'characters', KING)]);
    act(g, { type: 'endTurn' });
    expect(restedOf(g, KING)).toBe(true);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(kind(g)).toBe('main');
    expect(restedOf(g, KING)).toBe(false);
  });

  it("the held Character cannot attack on the opponent's turn while an active one can", () => {
    const g = played([
      { card: KING, rested: true },
      { card: MARCO, rested: true },
    ]);
    pickInst(g, [g.find('p2', 'characters', KING)]);
    act(g, { type: 'endTurn' });
    const attackers = new Set(g.legal().flatMap((a) => (a.type === 'attack' ? [a.attacker] : [])));
    expect(attackers.has(g.find('p2', 'characters', KING))).toBe(false);
    expect(attackers.has(g.find('p2', 'characters', MARCO))).toBe(true);
  });

  it('with no rested opposing Character there is nothing to hold and the effect does nothing', () => {
    const g = played([KING]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    act(g, { type: 'endTurn' });
    expect(restedOf(g, KING)).toBe(false);
  });

  it("DON!! cards are not Characters: the opponent's rested DON!! still become active", () => {
    const g = played([{ card: KING, rested: true }], { costArea: { active: 0, rested: 6 } });
    pickInst(g, [g.find('p2', 'characters', KING)]);
    act(g, { type: 'endTurn' });
    expect(don(g, 'p2').rested).toBe(0);
  });

  it('a Character that was active when played-on stays unaffected: it is not offered and not held', () => {
    const g = played([KING, { card: MARCO, rested: true }]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MARCO]);
  });
});
