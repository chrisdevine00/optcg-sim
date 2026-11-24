/**
 * OP15-083 Spoil (Character, Black, cost 1, 0 power, Counter +2000, {The Victims' Club}).
 *
 * Card text: "[On Play] Trash 3 cards from the top of your deck.
 * [Activate: Main] You may trash this Character: If you have 15 or more cards in your trash, give up to 1
 * rested DON!! card to 1 of your Leader or Character cards."
 *
 * Rules: CR 8-1-2 (mandatory), CR 8-3-1 (the cost is paid first, so the trashed Spoil counts for the
 * condition, which sits after the colon), CR 8-3-3 (a failed "if" stops the text), CR 8-4-4-1 ("up to"),
 * CR 6-5-5-1 / 6-5-5-2 (given DON!! add +1000 on my turn), CR 10-2-2-1 ([Activate: Main] in the Main Phase).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  BLUE,
  choices,
  deck,
  don,
  donOnField,
  fill,
  inst,
  kind,
  LD15,
  mine,
  need,
  none,
  offeredAbilities,
  pickInst,
  playRaw,
  SCN,
  theirs,
  trash,
  useAbility,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SPOIL = 'OP15-083';

function start(trashSize: number, rested = 2, chars: string[] = [SPOIL]): TestGame {
  return mine(LD15.moria, {
    characters: chars,
    trash: fill(BLUE, trashSize),
    costArea: { active: 3, rested },
  });
}
const spoil = (g: TestGame) => at(g, 'p1', 'characters', SPOIL);

describe('OP15-083 Spoil: [On Play] trash 3 from the deck; [Activate: Main] may trash this: with 15+ cards in trash, give a rested DON!! to my Leader or Character', () => {
  it('[On Play]: the top 3 cards of my deck go to the trash', () => {
    const g = mine(LD15.moria, {
      hand: [SPOIL],
      deck: [SCN.c2, SCN.c3, SCN.c4, SCN.c5, BLUE, BLUE],
    });
    playRaw(g, SPOIL);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SCN.c2, SCN.c3, SCN.c4].sort());
    expect(deck(g)).toHaveLength(3);
  });

  it('with 14 other cards in the trash (15 with Spoil, boundary): a rested DON!! goes to the Leader', () => {
    const g = start(14);
    useAbility(g, spoil(g));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toHaveLength(15);
    expect(don(g)).toMatchObject({ active: 3, rested: 1, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('with 13 other cards (14 with Spoil, boundary): Spoil is trashed but no DON!! is given', () => {
    const g = start(13);
    useAbility(g, spoil(g));
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toHaveLength(14);
    expect(don(g)).toMatchObject({ active: 3, rested: 2, given: 0 });
  });

  it('the DON!! may be given to one of my Characters instead (+1000 on my turn)', () => {
    const g = start(14, 2, [SPOIL, SCN.c3]);
    useAbility(g, spoil(g));
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).toContain(inst(g, 'p1', 'characters', SCN.c3));
    pickInst(g, [inst(g, 'p1', 'characters', SCN.c3)]);
    expect(g.power(at(g, 'p1', 'characters', SCN.c3))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only my own Leader or Characters are candidates, and Spoil (already trashed) is not', () => {
    const g = mine(
      LD15.moria,
      { characters: [SPOIL, SCN.c3], trash: fill(BLUE, 14), costArea: { active: 3, rested: 2 } },
      { characters: [SCN.c4] },
    );
    useAbility(g, spoil(g));
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(inst(g, 'p2', 'characters', SCN.c4));
    expect(choices(g)).toHaveLength(2);
  });

  it('exactly one DON!! is given, even with several rested', () => {
    const g = start(14, 4);
    useAbility(g, spoil(g));
    pickInst(g, [g.leader('p1')]);
    expect(don(g)).toMatchObject({ rested: 3, given: 1 });
  });

  it('"up to 1": giving nothing is legal and leaves the DON!! where it is', () => {
    const g = start(14);
    useAbility(g, spoil(g));
    need(g, 'choose', 'p1');
    none(g);
    expect(don(g)).toMatchObject({ active: 3, rested: 2, given: 0 });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('only a rested DON!! is given: with none rested nothing is given, Spoil is still trashed', () => {
    const g = start(14, 0);
    useAbility(g, spoil(g));
    if (kind(g) === 'choose') none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(don(g)).toMatchObject({ active: 3, rested: 0, given: 0 });
    expect(donOnField(g)).toBe(3);
  });

  it('the trash cost is paid by Spoil himself: no choice of what to trash is asked first', () => {
    const g = start(14);
    useAbility(g, spoil(g));
    need(g, 'choose', 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('[Activate: Main] is not offered on the opponent’s turn', () => {
    const g = theirs(LD15.moria, { characters: [SPOIL], trash: fill(BLUE, 14) });
    expect(offeredAbilities(g, spoil(g))).toEqual([]);
  });
});
