/** EB04-045 Ginny: [Activate: Main] you may rest this Character: if there are 2 or more Characters with a cost of 8 or more, up to 1 of your {Revolutionary Army} Leader or Character cards gains +1000 power during this turn. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import {
  canActivate,
  canPick,
  COST8,
  mine,
  OTHER_LEADER,
  REV2,
  REV_LEADER,
} from './helpers-eb04g2.ts';

const ID = 'EB04-045';

const setup = (mineChars: string[], theirs: string[], leader = REV_LEADER) =>
  mine({ leader, characters: [ID, ...mineChars] }, { characters: theirs });
const act = (g: ReturnType<typeof setup>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'activate' });

describe('EB04-045 Ginny', () => {
  it('with 2 cost 8+ Characters (one on each side): rest this Character, your {Revolutionary Army} Leader gains +1000 this turn', () => {
    const g = setup([COST8], [COST8]);
    act(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with only one cost 8 Character nothing happens (the other Characters have a lower cost)', () => {
    const g = setup([COST8, REV2, V.c3], []);
    act(g);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('target choice: Leader, Ginny herself and another {Revolutionary Army} Character, not a Character of another type', () => {
    const g = setup([REV2, V.c3], [COST8, COST8]);
    act(g);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', REV2))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p1', 'characters', REV2)]);
    expect(g.power(g.find('p1', 'characters', REV2))).toBe(5000);
  });

  it('boundary: a cost 7 Character does not count, so one cost 8 plus one cost 7 gives nothing', () => {
    const g = setup([], [COST8, V.c7]);
    act(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true); // the cost was paid
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('without a {Revolutionary Army} Leader the Leader is not a target', () => {
    const g = setup([], [COST8, COST8], OTHER_LEADER);
    act(g);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    none(g);
  });

  it('"up to 1": may choose nothing, and cannot be activated again while rested', () => {
    const g = setup([], [COST8, COST8]);
    act(g);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});
