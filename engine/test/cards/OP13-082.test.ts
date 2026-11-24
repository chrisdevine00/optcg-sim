/** OP13-082 Five Elders. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, hand, pick, V } from './helpers.ts';
import { activate } from './helpers-w3s.ts';
import {
  canActivate,
  canPick,
  FIVE_ELDERS,
  idsOf,
  IMU_LEADER,
  JU_PETER,
  MARS,
  mine,
  NUSJURO,
  OTHER_LEADER,
  pickableCards,
  pickCard,
  SATURN,
  settle,
  WARCURY,
} from './helpers-op13g3.ts';

const ID = FIVE_ELDERS;

describe('OP13-082 Five Elders', () => {
  const start = (
    trash: string[],
    opts: { leader?: string; hand?: string[]; chars?: string[]; active?: number } = {},
  ) =>
    mine(
      {
        leader: opts.leader ?? IMU_LEADER,
        hand: opts.hand ?? [V.c1],
        characters: opts.chars ?? [ID],
        trash,
      },
      {},
      opts.active ?? 3,
    );
  const ability = 'activate';

  it('[Activate: Main] with an [Imu] Leader: rest 1 DON!! and trash 1 card from your hand: trash all your Characters, then play up to 5 "Five Elders" Characters with 5000 power and different names from your trash', () => {
    const g = start([NUSJURO, JU_PETER, WARCURY, V.c3], { chars: [ID, V.c4] });
    activate(g, g.find('p1', 'characters', ID), ability);
    // Costs paid: 1 DON!! rested, 1 card of the hand trashed (asked: the hand is hidden).
    pickCard(g, V.c1);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
    expect(hand(g, 'p1')).toEqual([]);
    // Every Character was trashed; only Five Elders with 5000 power are candidates.
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(pickableCards(g).sort()).toEqual([NUSJURO, JU_PETER, WARCURY].sort());
    pick(
      g,
      [NUSJURO, JU_PETER, WARCURY].map((c) => g.find('p1', 'trash', c)),
    );
    settle(g);
    expect(idsOf(g, 'p1', 'characters').sort()).toEqual([NUSJURO, JU_PETER, WARCURY].sort());
    expect(idsOf(g, 'p1', 'trash').sort()).toEqual([V.c1, ID, V.c3, V.c4].sort());
  });

  it('"different card names": two copies of one name cannot both be played', () => {
    const g = start([NUSJURO, NUSJURO, JU_PETER]);
    activate(g, g.find('p1', 'characters', ID), ability);
    pickCard(g, V.c1);
    const copies = [g.find('p1', 'trash', NUSJURO, 0), g.find('p1', 'trash', NUSJURO, 1)];
    expect(canPick(g, copies[0]!) && canPick(g, copies[1]!)).toBe(true);
    expect(() => pick(g, copies)).toThrow();
  });

  it('one copy of each name is played: a duplicate is left in the trash', () => {
    const g = start([NUSJURO, NUSJURO, JU_PETER]);
    activate(g, g.find('p1', 'characters', ID), ability);
    pickCard(g, V.c1);
    pick(g, [g.find('p1', 'trash', NUSJURO, 0), g.find('p1', 'trash', JU_PETER)]);
    settle(g);
    expect(idsOf(g, 'p1', 'characters').sort()).toEqual([NUSJURO, JU_PETER].sort());
    expect(idsOf(g, 'p1', 'trash').filter((c) => c === NUSJURO)).toHaveLength(1);
  });

  it('the 12000-power Five Elders itself (trashed with the rest) and a non-Five-Elders 5000 Character are not candidates', () => {
    const g = start([V.c3], { chars: [ID, SATURN] });
    activate(g, g.find('p1', 'characters', ID), ability);
    pickCard(g, V.c1);
    // Saturn (Five Elders, 5000) came from the field and may return; Five Elders (12000) and the vanilla may not.
    expect(pickableCards(g)).toEqual([SATURN]);
  });

  it('can play all 5 distinct 5000-power Five Elders', () => {
    const g = start([NUSJURO, JU_PETER, WARCURY, SATURN, MARS], { hand: [V.c1] });
    activate(g, g.find('p1', 'characters', ID), ability);
    pickCard(g, V.c1);
    pick(
      g,
      [NUSJURO, JU_PETER, WARCURY, SATURN, MARS].map((c) => g.find('p1', 'trash', c)),
    );
    settle(g);
    expect(idsOf(g, 'p1', 'characters')).toHaveLength(5);
  });

  it('"up to 5": may play none; the Characters stay trashed', () => {
    const g = start([NUSJURO]);
    activate(g, g.find('p1', 'characters', ID), ability);
    pickCard(g, V.c1);
    g.act({ type: 'done' });
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('not offered without an [Imu] Leader (the "If" before the colon is an activation condition: nothing is paid)', () => {
    const g = start([NUSJURO], { leader: OTHER_LEADER });
    expect(canActivate(g, g.find('p1', 'characters', ID), ability)).toBe(false);
    expect(don(g, 'p1').rested).toBe(0);
  });

  it('not offered with an empty hand (the trash cost cannot be paid)', () => {
    const g = start([NUSJURO], { hand: [] });
    expect(canActivate(g, g.find('p1', 'characters', ID), ability)).toBe(false);
    expectDecision(g, 'main', 'p1');
  });
});
