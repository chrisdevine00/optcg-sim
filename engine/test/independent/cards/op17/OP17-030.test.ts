/**
 * OP17-030 Monkey.D.Luffy (Character, Green, cost 4, 5000, Counter +1000, {East Blue}/{Straw Hat Crew}).
 *
 * Card text: "[On Play] You may rest 1 of your DON!! cards: This Character gains [Rush] during this
 * turn. [Activate: Main] [Once Per Turn] If you have 5 or less cards in your hand, set up to 1 of
 * your DON!! cards as active."
 *
 * Rules: CR 8-3-1-3 (a cost that cannot be paid), CR 8-1-2 ("may"), CR 10-1-1 ([Rush]), CR 10-2-13
 * ([Once Per Turn]), CR 6-6-1-3 ("during this turn" ends in the End Phase), CR 8-3-3 (text after a
 * failed "if" does not resolve).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  BLUE,
  canAttackAnything,
  canHit,
  don,
  fill,
  kw,
  LD,
  mine,
  no,
  offeredAbilities,
  playCard,
  toMyNextMain,
  unusable,
  useAbility,
  yes,
} from './kit-op17b.ts';

const LUFFY = 'OP17-030';

/** Luffy is on the field (not summoning sick), `hand` cards in hand, DON!! as given. */
function onField(hand: number, active: number, rested: number) {
  return mine(LD.rhp, {
    characters: [LUFFY],
    hand: fill(BLUE, hand),
    costArea: { active, rested },
  });
}

describe('OP17-030 Monkey.D.Luffy: [On Play] rest 1 DON!!: [Rush]; [Activate: Main] set up 1 DON!!', () => {
  it('[On Play]: paying rests exactly 1 DON!! and grants [Rush], so it can attack the Leader this turn', () => {
    const g = mine(LD.rhp, { hand: [LUFFY] });
    playCard(g, LUFFY);
    yes(g);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 5, rested: 5 });
    const l = at(g, 'p1', 'characters', LUFFY);
    expect(kw(g, l)).toContain('Rush');
    expect(canHit(g, l, g.leader('p2'))).toBe(true);
  });

  it('[On Play]: declining the cost rests nothing and the Character has no [Rush] (summoning sickness)', () => {
    const g = mine(LD.rhp, { hand: [LUFFY] });
    playCard(g, LUFFY);
    no(g);
    expect(don(g)).toMatchObject({ active: 6, rested: 4 });
    const l = at(g, 'p1', 'characters', LUFFY);
    expect(kw(g, l)).not.toContain('Rush');
    expect(canAttackAnything(g, l)).toBe(false);
  });

  it('[On Play]: with no active DON!! left after paying the play cost, the cost cannot be paid (CR 8-3-1-3)', () => {
    const g = mine(LD.rhp, { hand: [LUFFY], costArea: { active: 4, rested: 0 } });
    playCard(g, LUFFY);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 0, rested: 4 });
    expect(kw(g, at(g, 'p1', 'characters', LUFFY))).not.toContain('Rush');
  });

  it('[Rush] lasts "during this turn" only: gone on the next turn', () => {
    const g = mine(LD.rhp, { hand: [LUFFY] });
    playCard(g, LUFFY);
    yes(g);
    expect(kw(g, at(g, 'p1', 'characters', LUFFY))).toContain('Rush');
    toMyNextMain(g);
    expect(kw(g, at(g, 'p1', 'characters', LUFFY))).not.toContain('Rush');
  });

  it('[Activate: Main]: with exactly 5 cards in hand, sets up 1 rested DON!! as active', () => {
    const g = onField(5, 3, 4);
    useAbility(g, at(g, 'p1', 'characters', LUFFY));
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 4, rested: 3 });
  });

  it('[Activate: Main]: "up to 1" sets up one DON!! only, even with several rested', () => {
    const g = onField(0, 0, 6);
    useAbility(g, at(g, 'p1', 'characters', LUFFY));
    expect(don(g)).toMatchObject({ active: 1, rested: 5 });
  });

  it('[Activate: Main]: with 6 cards in hand nothing is set up (boundary: 5 or less)', () => {
    const g = onField(6, 3, 4);
    const l = at(g, 'p1', 'characters', LUFFY);
    if (offeredAbilities(g, l).length) useAbility(g, l);
    expect(don(g)).toMatchObject({ active: 3, rested: 4 });
  });

  it('[Activate: Main]: [Once Per Turn], not offered a second time in the same turn', () => {
    const g = onField(2, 0, 5);
    const l = at(g, 'p1', 'characters', LUFFY);
    expect(offeredAbilities(g, l)).toHaveLength(1);
    useAbility(g, l);
    expect(don(g)).toMatchObject({ active: 1, rested: 4 });
    expect(offeredAbilities(g, l)).toHaveLength(0);
  });

  it('[Activate: Main] is usable on the turn the Character is played, and refunds the [On Play] cost', () => {
    const g = mine(LD.rhp, { hand: [LUFFY] });
    playCard(g, LUFFY);
    yes(g);
    expect(don(g)).toMatchObject({ active: 5, rested: 5 });
    useAbility(g, at(g, 'p1', 'characters', LUFFY));
    expect(don(g)).toMatchObject({ active: 6, rested: 4 });
  });

  it('[Activate: Main] with no rested DON!! changes nothing', () => {
    const g = onField(1, 5, 0);
    const l = at(g, 'p1', 'characters', LUFFY);
    if (offeredAbilities(g, l).length) useAbility(g, l);
    expect(don(g)).toMatchObject({ active: 5, rested: 0 });
    expect(atMain(g)).toBe(true);
  });
});
