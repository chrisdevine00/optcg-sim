/** EB04-052 Sanji: [When Attacking] this Character's base power becomes the same as your opponent's Leader during this turn; [On K.O.] with 2 or less Life, play up to 1 yellow Character with 6000 power or less from your hand. */
import { describe, expect, it } from 'vitest';
import { endCounter, expectDecision, none, passBlock, pick, V } from './helpers.ts';
import {
  boost,
  canPick,
  ids,
  koedInBattle,
  mine,
  OTHER_LEADER,
  PLAIN_BLUE,
  Y6000,
  Y7000,
} from './helpers-eb04g2.ts';

const ID = 'EB04-052';
const NEWGATE = 'OP02-001'; // Red Leader, 6000 power; only an [End of Your Turn] effect

const setup = (oppLeader: string, mineChar: string | { card: string; don: number } = ID) =>
  mine(
    { leader: OTHER_LEADER, characters: [mineChar], costArea: { active: 5, rested: 0 } },
    { leader: oppLeader },
  );
const attackLeader = (g: ReturnType<typeof setup>) =>
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

describe('EB04-052 Sanji', () => {
  it("[When Attacking] its base power becomes your opponent's Leader base power (6000)", () => {
    const g = setup(NEWGATE);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
    attackLeader(g);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it("the Leader's base power is copied, not its current power (a boosted or lowered Leader)", () => {
    const g = setup(PLAIN_BLUE);
    boost(g, g.leader('p2'), 2000);
    attackLeader(g);
    expect(g.power(g.leader('p2'))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });

  it('DON!! given to Sanji still add to the new base power', () => {
    const g = setup(NEWGATE, { card: ID, don: 2 });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    attackLeader(g);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(8000);
  });

  it('the new base power lasts for the turn and then ends', () => {
    const g = setup(NEWGATE);
    attackLeader(g);
    passBlock(g);
    endCounter(g);
    while (g.legal().some((a) => a.type === 'trigger')) g.act({ type: 'trigger', activate: false });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
  });

  it('[On K.O.] with 2 Life: play a yellow Character with 6000 power or less from hand', () => {
    const g = koedInBattle(
      ID,
      { leader: OTHER_LEADER, hand: [Y6000, Y7000, V.c3], life: [V.c1, V.c1] },
      {},
    );
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', Y6000))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', Y7000))).toBe(false); // 7000 power
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false); // not yellow
    pick(g, [g.find('p1', 'hand', Y6000)]);
    expect(ids(g, 'p1', 'characters')).toEqual([Y6000]);
  });

  it('[On K.O.] with 3 Life nothing is played and no prompt is shown', () => {
    const g = koedInBattle(
      ID,
      { leader: OTHER_LEADER, hand: [Y6000], life: [V.c1, V.c1, V.c1] },
      {},
    );
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(ids(g, 'p1', 'hand')).toEqual([Y6000]);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('[On K.O.] "up to 1": may play nothing', () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER, hand: [Y6000], life: [V.c1] }, {});
    none(g);
    expect(ids(g, 'p1', 'hand')).toEqual([Y6000]);
  });
});
