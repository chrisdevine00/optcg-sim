/**
 * OP17-033 Lucky.Roux (Character, Green, cost 4, 5000, Counter +1000, {Red-Haired Pirates}).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck; reveal up to 1 card with a type
 * including "Red-Haired Pirates" and add it to your hand. Then, place the rest at the bottom of
 * your deck in any order. [On Your Opponent's Attack] You may trash this Character: Rest up to 1
 * of your opponent's Leader or Characters."
 *
 * Rules: CR 10-2-16 / RD 89 ([On Your Opponent's Attack] activates whatever is attacked), CR 8-3-1
 * (cost), CR 10-2-14 (trash is not a K.O.), CR 7-1-1-4 (target moved: skip to End of the Battle).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  canUse,
  choices,
  describeLook,
  kind,
  LD,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  pickCards,
  pickInst,
  playCard,
  SCN,
  theirs,
  trash,
  yes,
  mayChooseNone,
  n,
  passCounter,
  chars,
} from './kit-op17b.ts';

const ROUX = 'OP17-033';

describeLook({
  id: ROUX,
  n: 3,
  start: (cards) => {
    const g = mine(LD.neutral, { hand: [ROUX], deck: cards });
    playCard(g, ROUX);
    return g;
  },
  match: ['OP09-006', 'OP09-016'],
  substr: 'OP17-026',
  miss: BLUE,
});

/** p2 attacks p1's Leader; p1 has an active Roux. */
function defending(p2chars: string[] = [SCN.c3]) {
  const g = theirs(LD.rhp, { characters: [ROUX] }, { characters: p2chars });
  attack(g, g.leader('p2'), g.leader('p1'));
  return g;
}

describe("OP17-033 Lucky.Roux: [On Your Opponent's Attack] trash this: rest up to 1 opposing Leader or Character", () => {
  it('when attacked, p1 may trash Roux to rest an opposing Character', () => {
    const g = defending();
    need(g, 'optional', 'p1');
    yes(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c3]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(true);
    expect(trash(g)).toEqual([ROUX]);
    expect(chars(g)).toEqual([]);
  });

  it("the candidates are the opponent's Leader and Characters, never my own cards", () => {
    const g = theirs(LD.rhp, { characters: [ROUX, SCN.c2] }, { characters: [SCN.c3] });
    attack(g, g.leader('p2'), g.leader('p1'));
    yes(g);
    need(g, 'choose');
    expect(choices(g)).toContain(g.leader('p2'));
    expect(offeredIds(g)).toContain(SCN.c3);
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).not.toContain(SCN.c2);
    expect(offeredIds(g)).not.toContain(ROUX);
  });

  it('declining keeps Roux and rests nothing', () => {
    const g = defending();
    no(g);
    expect(chars(g)).toEqual([ROUX]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(false);
  });

  it('"up to 1": after the cost is paid the target may be skipped (Roux is still trashed)', () => {
    const g = defending();
    yes(g);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(trash(g)).toEqual([ROUX]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(false);
  });

  it('the attack continues after Roux leaves: Block and Counter Steps follow and the Leader is hit', () => {
    const g = defending();
    yes(g);
    pickCards(g, [SCN.c3]);
    expect(kind(g)).toBe('block');
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('can rest the opposing Leader (a legal "Leader or Characters" target)', () => {
    const g = theirs(LD.rhp, { characters: [ROUX] }, { characters: [SCN.c3] });
    attack(g, g.find('p2', 'characters', SCN.c3), g.leader('p1'));
    yes(g);
    need(g, 'choose');
    expect(g.card(g.leader('p2')).rested).toBe(false);
    pickInst(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).rested).toBe(true);
  });

  it('activates when one of my other rested Characters is attacked, not only for Leader attacks', () => {
    const g = theirs(
      LD.rhp,
      { characters: [ROUX, { card: SCN.c2, rested: true }] },
      { characters: [SCN.c3] },
    );
    attack(g, g.find('p2', 'characters', SCN.c3), g.find('p1', 'characters', SCN.c2));
    expect(canUse(g)).toBe(true);
  });

  it('when Roux itself is the attacked Character, trashing it ends the battle (the target left the field)', () => {
    const g = theirs(
      LD.rhp,
      { characters: [{ card: ROUX, rested: true }] },
      { characters: [SCN.c3] },
    );
    attack(g, g.leader('p2'), g.find('p1', 'characters', ROUX));
    yes(g);
    if (kind(g) === 'choose') pickCards(g, [SCN.c3]);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ROUX]);
  });

  it('is offered on every attack (no once-per-turn): declined on the first, accepted on the second', () => {
    const g = theirs(LD.rhp, { characters: [ROUX] }, { characters: [SCN.c3] });
    attack(g, g.leader('p2'), g.leader('p1'));
    no(g);
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    attack(g, g.find('p2', 'characters', SCN.c3), g.leader('p1'));
    expect(canUse(g)).toBe(true);
  });

  it('must not happen: no prompt when the opponent attacks and Roux is not on the field', () => {
    const g = theirs(LD.rhp, {}, { characters: [SCN.c3] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(n(g, 'p1', 'trash')).toBe(0);
  });
});
