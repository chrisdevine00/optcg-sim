/**
 * OP11-103 Long-Jaw Neptunian (Character, Yellow, cost 5, 7000, no Counter, {Neptunian}).
 *
 * Card text: "[Activate: Main] If your Leader is [Shirahoshi], you may rest this Character and turn 1
 * card from the top of your Life cards face-down: K.O. up to 1 of your opponent's Characters with a
 * cost of 3 or less."
 *
 * Rules: CR 8-3-2 (If), CR 8-3-1-4 (cost), CR 1-3-2-1 (turning a face-down card face-down is
 * impossible, so the cost needs a face-up top Life card), CR 8-4-4 ("up to"), only Characters have a
 * cost so the opposing Leader is never a target.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chars,
  cnt,
  kind,
  LD11,
  lifeFaces,
  lifeUp,
  mayChooseNone,
  me,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  SC11,
  trash,
  unusable,
  up,
  useAbility,
  yes,
  type LifeRow,
} from './kit-op11c.ts';

const ID = 'OP11-103';

function board(
  o: {
    leader?: string;
    rested?: boolean;
    life?: LifeRow;
    foe?: string[];
  } = {},
) {
  return me(
    o.leader ?? LD11.shirahoshi,
    { characters: [{ card: ID, rested: o.rested ?? false }], life: o.life ?? lifeUp(4) },
    { characters: o.foe ?? [SC11.r3, SC11.r4, SC11.r2] },
  );
}

/** Activate and accept the cost question if it is asked. */
function activate(g: ReturnType<typeof board>) {
  useAbility(g, at(g, 'p1', 'characters', ID));
  if (kind(g) === 'optional') yes(g, 'p1');
}

describe('OP11-103 Long-Jaw Neptunian: rest it and turn my top Life card face-down to K.O. a cost-3-or-less Character', () => {
  it('printed effect: rested, top Life card face-down, the chosen Character is K.O.’d', () => {
    const g = board();
    activate(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r3)]);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(lifeFaces(g)).toEqual([false, true, true, true]);
    expect(chars(g, 'p2')).toEqual([SC11.r2, SC11.r4].sort());
    expect(trash(g, 'p2')).toEqual([SC11.r3]);
    expect(kind(g)).toBe('main');
  });

  it('boundary: cost 3 and cost 2 are offered, cost 4 is not', () => {
    const g = board();
    activate(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([SC11.r2, SC11.r3].sort());
  });

  it('the opposing Leader is never a target (it has no cost)', () => {
    const g = board();
    activate(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(LD11.plain);
  });

  it('"up to 1": after paying I may K.O. nobody (the cost stays paid)', () => {
    const g = board();
    activate(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cnt(g, 'p2', 'characters')).toBe(3);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
  });

  it('activating is choosing to pay: the cost is taken at once (rested, Life face-down) before the target is picked', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(lifeFaces(g)).toEqual([false, true, true, true]);
    need(g, 'choose', 'p1');
  });

  it('a Leader that is not [Shirahoshi]: nothing is paid and nothing is K.O.’d', () => {
    const g = board({ leader: LD11.plain });
    if (offeredAbilities(g, at(g, 'p1', 'characters', ID)).length) {
      useAbility(g, at(g, 'p1', 'characters', ID));
      if (kind(g) === 'optional') unusable(g, 'p1');
    }
    expect(cnt(g, 'p2', 'characters')).toBe(3);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(false);
    expect(lifeFaces(g)).toEqual([true, true, true, true]);
  });

  it('already rested: the rest cost cannot be paid, so it cannot be activated', () => {
    const g = board({ rested: true });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('unpayable: my top Life card is face-down already, so nothing can be turned face-down', () => {
    const g = board({ life: [SC11.r1, up(SC11.r2), up(SC11.r3)] });
    if (offeredAbilities(g, at(g, 'p1', 'characters', ID)).length) {
      useAbility(g, at(g, 'p1', 'characters', ID));
      unusable(g, 'p1');
    }
    expect(cnt(g, 'p2', 'characters')).toBe(3);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(false);
  });

  it('unpayable: no Life cards', () => {
    const g = board({ life: [] });
    if (offeredAbilities(g, at(g, 'p1', 'characters', ID)).length) {
      useAbility(g, at(g, 'p1', 'characters', ID));
      unusable(g, 'p1');
    }
    expect(cnt(g, 'p2', 'characters')).toBe(3);
  });
});
