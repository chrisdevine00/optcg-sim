/**
 * OP11-043 Vinsmoke Ichiji (Blue Character, cost 7, 7000, no Counter, {The Vinsmoke Family}/
 * {GERMA 66}, [Blocker]).
 *
 * Card text: "[Blocker] [On Your Opponent's Attack] [Once Per Turn] This effect can be activated when you
 * only have Characters with a type including "GERMA". Up to 1 of your Leader or Character cards
 * gains +1000 power during this battle. Then, trash 2 cards from the top of your deck."
 *
 * Rules: the condition looks at every Character I have (rested or not): all must have a type
 * including "GERMA" (substring, so {Kingdom of GERMA} counts). Once per turn. The boost lasts for
 * the battle. "Up to 1" may be none.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  C11,
  choices,
  deck,
  fill,
  kind,
  L11,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickInst,
  theirs,
  trash,
} from './kit-op11b.ts';

const ICHIJI = 'OP11-043';
/** OP10-064 Clone Soldier: Purple, cost 2, 2000, {The Vinsmoke Family}/{Kingdom of GERMA}, [Blocker]. */
const KINGDOM = 'OP10-064';
const D = (n: number) => fill(C11.c7, n);

function defend(
  chars: (string | { card: string; rested?: boolean })[],
  deckTop: string[] = [C11.c1, C11.c2, ...D(10)],
) {
  const g = theirs(
    L11.mono,
    { characters: [ICHIJI, ...chars], deck: deckTop },
    { characters: [C11.c3] },
  );
  attack(g, at(g, 'p2', 'characters', C11.c3), g.leader('p1'));
  return g;
}

describe("OP11-043 Vinsmoke Ichiji: [Blocker]; [On Your Opponent's Attack] +1000, then trash 2 from the deck, only with GERMA Characters", () => {
  it('with only GERMA Characters it fires: +1000 to the Leader makes 6000, the 5000 attack fails, the top 2 cards are trashed', () => {
    const g = defend([C11.germa5]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(trash(g)).toEqual([C11.c1, C11.c2].sort());
    expect(deck(g)).toHaveLength(10);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('Ichiji alone satisfies the condition', () => {
    const g = defend([]);
    need(g, 'choose', 'p1');
  });

  it('a Character whose type merely includes "GERMA" ({Kingdom of GERMA}) counts as a GERMA Character', () => {
    const g = defend([KINGDOM]);
    need(g, 'choose', 'p1');
  });

  it('a Character of another type switches it off: no prompt, nothing trashed, no boost', () => {
    const g = defend([C11.germa5, C11.c3]);
    expect(kind(g)).toBe('block');
    expect(trash(g)).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a rested Character of another type also switches it off', () => {
    const g = defend([{ card: C11.c3, rested: true }]);
    expect(kind(g)).toBe('block');
    expect(trash(g)).toEqual([]);
  });

  it('the boost may go to a Character instead; only my Leader and Characters are offered', () => {
    const g = defend([C11.germa5]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g).filter((c) => c !== null)).toEqual([L11.mono, ICHIJI, C11.germa5].sort());
    pickInst(g, [at(g, 'p1', 'characters', C11.germa5)]);
    expect(g.power(at(g, 'p1', 'characters', C11.germa5))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may choose nobody; there is no boost', () => {
    const g = defend([]);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', ICHIJI))).toBe(7000);
  });

  it('the boost ends with the battle', () => {
    const g = defend([]);
    pickInst(g, [g.leader('p1')]);
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: a second attack in the same turn does not fire it again', () => {
    const g = theirs(
      L11.mono,
      { characters: [ICHIJI], deck: [C11.c1, C11.c2, ...D(10)] },
      { characters: [C11.c3, C11.c4] },
    );
    attack(g, at(g, 'p2', 'characters', C11.c3), g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    passBlock(g);
    passCounter(g);
    attack(g, at(g, 'p2', 'characters', C11.c4), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(trash(g)).toHaveLength(2);
  });

  it('has [Blocker] and can block the attack', () => {
    const g = defend([]);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(at(g, 'p1', 'characters', ICHIJI)).keywords).toContain('Blocker');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ICHIJI)]);
  });
});
