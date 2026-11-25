/**
 * OP09-091 Vasco Shot (Character, Black, cost 2, 2000, Counter +1000, {Blackbeard Pirates}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)"
 *
 * Rules: Block Step (CR 7-1-2): the defender may rest an active [Blocker] to redirect the attack to
 * it; a rested Character cannot block; the battle is then fought against the blocker (CR 7-1-4).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  block,
  blockers,
  chr,
  kind,
  LD9,
  need,
  noDefenceAtAll,
  SC9,
  theirs,
  trash,
} from './kit-op09c.ts';

const VASCO = 'OP09-091';

function defend(o: { vascoRested?: boolean; hand?: string[]; p2chars?: string[] } = {}) {
  const g = theirs(
    LD9.bbp,
    {
      characters: [{ card: VASCO, rested: o.vascoRested ?? false }, SC9.c4],
      hand: o.hand ?? [],
    },
    { characters: o.p2chars ?? [SC9.c4], costArea: { active: 10, rested: 0 } },
  );
  return g;
}

describe('OP09-091 Vasco Shot: [Blocker]', () => {
  it('printed values: cost 2, 2000, Counter +1000, keyword [Blocker]', () => {
    const g = defend();
    const c = g.card(chr(g, 'p1', VASCO));
    expect(c.cost).toBe(2);
    expect(c.power).toBe(2000);
    expect(c.counter).toBe(1000);
    expect(c.keywords).toContain('Blocker');
  });

  it('is offered as a blocker when my Leader is attacked', () => {
    const g = defend();
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toContain(chr(g, 'p1', VASCO));
  });

  it("blocking rests Vasco Shot and the attack is fought against it: it is K.O.'d by 5000 power, my Leader takes no damage", () => {
    const g = defend();
    attack(g, g.leader('p2'), g.leader('p1'));
    block(g, chr(g, 'p1', VASCO));
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([VASCO]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SC9.c4]);
  });

  it('blocking an attacker with less power than its own: Vasco Shot survives, rested; the Leader takes no damage', () => {
    const g = defend({ p2chars: ['OP09-087'] }); // Charlotte Pudding: 0 power
    attack(g, chr(g, 'p2', 'OP09-087'), g.leader('p1'));
    block(g, chr(g, 'p1', VASCO));
    noDefenceAtAll(g);
    expect(g.life('p1')).toBe(4);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([VASCO, SC9.c4].sort());
    expect(g.card(chr(g, 'p1', VASCO)).rested).toBe(true);
  });

  it('a Counter on Vasco Shot adds to its power in the battle it blocked (+1000 each)', () => {
    const g = defend({ hand: [SC9.c1] });
    attack(g, g.leader('p2'), g.leader('p1'));
    block(g, chr(g, 'p1', VASCO));
    need(g, 'counter', 'p1');
    const counter = g
      .legal()
      .find(
        (a) =>
          a.type === 'counter' &&
          a.card === g.find('p1', 'hand', SC9.c1) &&
          a.target === chr(g, 'p1', VASCO),
      );
    expect(counter).toBeTruthy();
    g.act(counter!);
    expect(g.power(chr(g, 'p1', VASCO))).toBe(3000);
  });

  it('a rested Vasco Shot cannot block', () => {
    const g = defend({ vascoRested: true });
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).not.toContain(chr(g, 'p1', VASCO));
  });

  it('it may also block an attack aimed at another of my Characters (rested Character as target)', () => {
    const g = theirs(
      LD9.bbp,
      { characters: [VASCO, { card: SC9.c4, rested: true }] },
      { characters: [SC9.c4] },
    );
    attack(g, chr(g, 'p2', SC9.c4), chr(g, 'p1', SC9.c4));
    need(g, 'block', 'p1');
    expect(blockers(g)).toContain(chr(g, 'p1', VASCO));
  });

  it('declining to block: the attack hits the original target (Life 4 -> 3)', () => {
    const g = defend();
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceAtAll(g);
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
  });

  it('must not give [Blocker] to my other Characters', () => {
    const g = defend();
    expect(g.card(chr(g, 'p1', SC9.c4)).keywords).not.toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([chr(g, 'p1', VASCO)]);
  });
});
