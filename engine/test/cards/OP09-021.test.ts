/** OP09-021 Red Force (Stage, cost 2). */
import { describe, expect, it } from 'vitest';
import {
  activate,
  canPick,
  expectDecision,
  mk,
  none,
  offeredAb,
  OTHER_LEADER,
  pick,
  RHP_LEADER,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-021';

describe('OP09-021 Red Force: [Activate: Main]', () => {
  const start = (leader: string, theirs: string[] = [V.c3, V.c5]) =>
    mk({ leader, stage: ID, characters: [V.c1] }, { characters: theirs });
  const stage = (g: ReturnType<typeof start>) => g.find('p1', 'stage', ID);

  it('rest this Stage: with a Red-Haired Pirates Leader, an opposing Character gets -1000 power during this turn', () => {
    const g = start(RHP_LEADER);
    expect(offeredAb(g, stage(g), 'activate')).toBe(true);
    activate(g, stage(g), 'activate');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
    expect(g.card(stage(g)).rested).toBe(true);
  });

  it('the -1000 lasts until the end of the turn', () => {
    const g = start(RHP_LEADER);
    activate(g, stage(g), 'activate');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(6000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });

  it('"up to 1": may choose nobody (the Stage is still rested)', () => {
    const g = start(RHP_LEADER);
    activate(g, stage(g), 'activate');
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    expect(g.card(stage(g)).rested).toBe(true);
  });

  it('with another Leader the Stage still rests, but nothing happens and nothing is asked', () => {
    const g = start(OTHER_LEADER);
    expect(offeredAb(g, stage(g), 'activate')).toBe(true);
    activate(g, stage(g), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(g.card(stage(g)).rested).toBe(true);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });

  it('cannot be activated while it is rested', () => {
    const g = mk({ leader: RHP_LEADER, stage: { card: ID, rested: true } }, { characters: [V.c3] });
    expect(offeredAb(g, g.find('p1', 'stage', ID), 'activate')).toBe(false);
  });
});
