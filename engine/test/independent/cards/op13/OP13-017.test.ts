/**
 * OP13-017 Monkey.D.Dragon (Character, Red, cost 6, 7000, Counter +1000, {Revolutionary Army}, Special).
 *
 * Card text (verified): "[Once Per Turn] If your {Revolutionary Army} type Character would be
 * removed from the field by your opponent's effect, you may give this Character -2000 power during
 * this turn instead."
 *
 * Rules: CR 8-1-3-4 (replacement; "may" makes it optional, a declined replacement does not
 * resolve), [Once Per Turn] is spent when the effect resolves, not when it is declined (as in the
 * OP17 independent tests). "Removed from the field" covers a K.O. and any other removal. Only the
 * opponent's effects count, not battle and not the owner's own effects.
 * Scenery: OP09-077 Gum-Gum Lightning (K.O. up to 1 of the opponent's Characters, 6000 power or
 * less) and OP13-058 Phoenix Pyreapple (rest 1 DON!!: place up to 1 opposing Character with 3000
 * power or less at the bottom of its owner's deck), both used by p2.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  cardIds,
  charsOfIds,
  decision,
  endTurn,
  kind,
  L13,
  need,
  no,
  noDefence,
  opponentKOs,
  pickInst,
  playRaw,
  SC2,
  theirs,
  trash,
  V13,
  yes,
} from './kit-op13a.ts';

const DRAGON = 'OP13-017';
const IVAN = 'OP13-008';
const PYRE = 'OP13-058';

function board(chars: string[], p2hand: string[] = [SC2.lightning, SC2.lightning]) {
  return theirs(L13.luffy, { characters: [DRAGON, ...chars] }, { hand: p2hand });
}
const dragonPower = (g: ReturnType<typeof board>) => g.power(at(g, 'p1', 'characters', DRAGON));

describe('OP13-017 Monkey.D.Dragon: -2000 to this Character instead of a Revolutionary Army removal by the opponent', () => {
  it('printed values: cost 6, 7000, Counter +1000', () => {
    const g = board([]);
    const c = g.card(at(g, 'p1', 'characters', DRAGON));
    expect(c.cost).toBe(6);
    expect(c.power).toBe(7000);
    expect(c.counter).toBe(1000);
  });

  it('a K.O. effect on my {Revolutionary Army} Character offers it; accepting: no K.O., Dragon gets -2000 this turn', () => {
    const g = board([V13.koala]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(charsOfIds(g, 'p1')).toEqual([DRAGON, V13.koala].sort());
    expect(trash(g)).toEqual([]);
    expect(dragonPower(g)).toBe(5000);
  });

  it('declining: the Character is K.O.d as printed and Dragon keeps 7000', () => {
    const g = board([V13.koala]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    no(g, 'p1');
    expect(charsOfIds(g, 'p1')).toEqual([DRAGON]);
    expect(trash(g)).toEqual([V13.koala]);
    expect(dragonPower(g)).toBe(7000);
  });

  it('a Character that is not {Revolutionary Army} gets no offer', () => {
    const g = board([V13.marco]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.marco));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([V13.marco]);
    expect(dragonPower(g)).toBe(7000);
  });

  it('a K.O. in battle is not covered: no offer', () => {
    const g = theirs(
      L13.luffy,
      { characters: [DRAGON, { card: V13.koala, rested: true }] as never },
      { characters: [V13.thatch] },
    );
    attack(g, at(g, 'p2', 'characters', V13.thatch), at(g, 'p1', 'characters', V13.koala));
    noDefence(g);
    expect(decision(g)?.kind).toBe('main');
    expect(trash(g)).toEqual([V13.koala]);
    expect(dragonPower(g)).toBe(7000);
  });

  it('removal other than a K.O. is covered too: an opposing effect placing my Character at the deck bottom', () => {
    const g = board([IVAN], [PYRE]);
    playRaw(g, PYRE);
    // Phoenix Pyreapple: "You may rest 1 of your DON!! cards" then the target pick.
    if (kind(g) === 'optional') yes(g, 'p2');
    for (let i = 0; i < 3 && kind(g) === 'choose' && g.decider === 'p2'; i++) {
      const d = decision(g)!;
      if (d.purpose === 'cost') {
        const pay = g.legal().find((a) => a.type === 'pick');
        g.act(pay!);
      } else {
        pickInst(g, [at(g, 'p1', 'characters', IVAN)]);
      }
    }
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(charsOfIds(g, 'p1')).toEqual([DRAGON, IVAN].sort());
    expect(dragonPower(g)).toBe(5000);
  });

  it('[Once Per Turn]: after one accepted replacement, a second removal in the same turn is not offered', () => {
    const g = board([V13.koala, V13.hackRed]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    yes(g, 'p1');
    opponentKOs(g, at(g, 'p1', 'characters', V13.hackRed));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([V13.hackRed]);
    expect(dragonPower(g)).toBe(5000);
  });

  it('[Once Per Turn] is spent only when it resolves: declined first, offered again on the next removal', () => {
    const g = board([V13.koala, V13.hackRed]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    no(g, 'p1');
    opponentKOs(g, at(g, 'p1', 'characters', V13.hackRed));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(trash(g)).toEqual([V13.koala]);
    expect(charsOfIds(g, 'p1')).toEqual([DRAGON, V13.hackRed].sort());
  });

  it('the -2000 lasts this turn only: Dragon is back to 7000 when the turn passes to me', () => {
    const g = board([V13.koala]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    yes(g, 'p1');
    expect(dragonPower(g)).toBe(5000);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(dragonPower(g)).toBe(7000);
  });

  it('with Emporio.Ivankov (OP13-008) also on the field, one K.O. is replaced once: either Ivankov is trashed or Dragon gets -2000, never both', () => {
    const g = board([IVAN, V13.koala]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    for (let i = 0; i < 3 && (kind(g) === 'order' || kind(g) === 'optional'); i++) {
      if (kind(g) === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
      else yes(g, 'p1');
    }
    expect(charsOfIds(g, 'p1')).toContain(V13.koala);
    const ivankovGone = !charsOfIds(g, 'p1').includes(IVAN);
    const dragonHit = dragonPower(g) === 5000;
    expect(ivankovGone !== dragonHit).toBe(true);
    expect(trash(g)).toEqual(ivankovGone ? [IVAN] : []);
  });

  it('with Dragon only in my hand there is no replacement', () => {
    const g = theirs(
      L13.luffy,
      { characters: [V13.koala], hand: [DRAGON] },
      { hand: [SC2.lightning] },
    );
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'trash')).toEqual([V13.koala]);
  });
});
