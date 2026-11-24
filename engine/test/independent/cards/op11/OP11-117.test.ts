/**
 * OP11-117 Fish-Man Island (Stage, Yellow, cost 2, {Fish-Man Island}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] If your Leader is [Shirahoshi], you may turn 1 card from
 * the top of your Life cards face-up: Up to 1 of your "Neptunian", "Fish-Man", or "Merfolk" type
 * Characters gains +1000 power during this turn."
 *
 * Rules: CR 8-3-2 (If), CR 8-3-1-4 (cost), M4b-3 (a card that is already face-up cannot be turned
 * face-up: the cost needs a face-down top Life card), CR 10-2 ([Once Per Turn]), CR 8-4-4 ("up to").
 * Scenery: OP11-026 Scaled Neptunian ({Neptunian}), OP02-033 Jinbe ({Fish-Man}), OP03-111 Praline
 * ({Merfolk}), OP01-023 Marco (no type of these).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  kind,
  LD11,
  lifeFaces,
  mayChooseNone,
  me,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  playRaw,
  SC11,
  unusable,
  up,
  useAbility,
  cnt,
  type LifeRow,
} from './kit-op11c.ts';

const ID = 'OP11-117';
const NEPTUNIAN = SC11.neptunian6;
const FISHMAN = SC11.fishMan2;
const MERFOLK = SC11.merfolk3;

function board(
  o: {
    leader?: string;
    life?: LifeRow;
    chars?: string[];
    stage?: boolean;
  } = {},
) {
  return me(
    o.leader ?? LD11.shirahoshi,
    {
      stage: ID,
      characters: o.chars ?? [NEPTUNIAN, FISHMAN, MERFOLK, SC11.r3],
      ...(o.life ? { life: o.life } : {}),
    },
    {},
  );
}

function activate(g: ReturnType<typeof board>) {
  useAbility(g, at(g, 'p1', 'stage', ID));
  if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
}

describe('OP11-117 Fish-Man Island: turn my top Life card face-up for +1000 power on a Neptunian / Fish-Man / Merfolk Character', () => {
  it('printed effect: the top Life card turns face-up and the chosen Character gets +1000 this turn', () => {
    const g = board();
    activate(g);
    expect(lifeFaces(g)[0]).toBe(true);
    expect(lifeFaces(g).slice(1)).toEqual([false, false, false]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', NEPTUNIAN)]);
    expect(g.power(at(g, 'p1', 'characters', NEPTUNIAN))).toBe(9000);
    expect(kind(g)).toBe('main');
  });

  it('offers {Neptunian}, {Fish-Man} and {Merfolk} Characters but not a Character of another type', () => {
    const g = board();
    activate(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([NEPTUNIAN, FISHMAN, MERFOLK].sort());
  });

  it('a {Merfolk} Character gets the power too', () => {
    const g = board();
    activate(g);
    pickInst(g, [at(g, 'p1', 'characters', MERFOLK)]);
    expect(g.power(at(g, 'p1', 'characters', MERFOLK))).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', NEPTUNIAN))).toBe(8000);
  });

  it('only Characters: my Leader is not a target', () => {
    const g = board();
    activate(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(LD11.shirahoshi);
  });

  it('"up to 1": I may give the power to nobody (the Life card stays face-up)', () => {
    const g = board();
    activate(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(lifeFaces(g)[0]).toBe(true);
    expect(g.power(at(g, 'p1', 'characters', NEPTUNIAN))).toBe(8000);
  });

  it('[Once Per Turn]: it is not offered again this turn', () => {
    const g = board();
    activate(g);
    pickInst(g, [at(g, 'p1', 'characters', NEPTUNIAN)]);
    expect(offeredAbilities(g, at(g, 'p1', 'stage', ID))).toEqual([]);
  });

  it('the +1000 lasts for this turn only', () => {
    const g = board();
    activate(g);
    pickInst(g, [at(g, 'p1', 'characters', NEPTUNIAN)]);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.power(at(g, 'p1', 'characters', NEPTUNIAN))).toBe(8000);
  });

  it('a Leader that is not [Shirahoshi]: no power is given and no Life card is turned', () => {
    const g = board({ leader: LD11.plain });
    if (offeredAbilities(g, at(g, 'p1', 'stage', ID)).length) {
      useAbility(g, at(g, 'p1', 'stage', ID));
      if (kind(g) === 'optional') unusable(g, 'p1');
      if (kind(g) === 'choose') none(g);
    }
    expect(lifeFaces(g)).toEqual([false, false, false, false]);
    expect(g.power(at(g, 'p1', 'characters', NEPTUNIAN))).toBe(8000);
  });

  it('unpayable: the top Life card is already face-up (it cannot be turned face-up)', () => {
    const g = board({ life: [up(SC11.r1), SC11.r2, SC11.r3] });
    if (offeredAbilities(g, at(g, 'p1', 'stage', ID)).length) {
      useAbility(g, at(g, 'p1', 'stage', ID));
      unusable(g, 'p1');
    }
    expect(g.power(at(g, 'p1', 'characters', NEPTUNIAN))).toBe(8000);
  });

  it('unpayable: no Life cards', () => {
    const g = board({ life: [] });
    if (offeredAbilities(g, at(g, 'p1', 'stage', ID)).length) {
      useAbility(g, at(g, 'p1', 'stage', ID));
      unusable(g, 'p1');
    }
    expect(cnt(g, 'p1', 'life')).toBe(0);
    expect(g.power(at(g, 'p1', 'characters', NEPTUNIAN))).toBe(8000);
  });

  it('only the top card matters: a face-down top card above face-up ones can pay', () => {
    const g = board({ life: [SC11.r1, up(SC11.r2), up(SC11.r3)] });
    activate(g);
    expect(lifeFaces(g)).toEqual([true, true, true]);
    need(g, 'choose', 'p1');
  });

  it('it can be activated the turn it is played (a Stage has no summoning sickness for [Activate: Main])', () => {
    const g = me(LD11.shirahoshi, { hand: [ID], characters: [NEPTUNIAN] });
    playRaw(g, ID);
    expect(offeredAbilities(g, at(g, 'p1', 'stage', ID))).toEqual(['activate']);
  });
});
