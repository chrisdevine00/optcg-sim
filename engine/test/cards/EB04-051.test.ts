/** EB04-051 Emet: cannot attack unless there is a Character with 12000 base power or more; [Trigger] all opposing Characters -3000 power this turn, then with 0 Life play this card. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, PLAIN_BLUE, V } from './helpers.ts';
import { BIG12, boost, canAttack, ids, mine, OTHER_LEADER, triggerHit } from './helpers-eb04g2.ts';

const ID = 'EB04-051';

const setup = (mineChars: string[], theirs: string[]) =>
  mine({ leader: OTHER_LEADER, characters: [ID, ...mineChars] }, { characters: theirs });
const can = (g: ReturnType<typeof setup>) =>
  canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'));

describe('EB04-051 Emet', () => {
  it('cannot attack when no Character has 12000 base power or more', () => {
    const g = setup([V.c7], [V.c7]);
    expect(can(g)).toBe(false);
  });

  it('can attack when the opponent has a 12000 base power Character', () => {
    const g = setup([], [BIG12]);
    expect(can(g)).toBe(true);
  });

  it('B4T-R5: the threshold is 12000: an 11000 base power Character (either side) does not enable it', () => {
    const SHANKS11 = 'ST16-004'; // cost 9, 11000 base power
    expect(can(setup([], [SHANKS11]))).toBe(false);
    expect(can(setup([SHANKS11], []))).toBe(false);
  });

  it('can attack when you have one yourself', () => {
    const g = setup([BIG12], []);
    expect(can(g)).toBe(true);
  });

  it('base power counts, not current power: a 9000 Character boosted to 12000 does not enable it', () => {
    const g = setup([V.c7], []);
    boost(g, g.find('p1', 'characters', V.c7), 3000);
    expect(g.power(g.find('p1', 'characters', V.c7))).toBe(12000);
    expect(can(g)).toBe(false);
  });

  it('a 12000 base power Character lowered below 12000 still enables it', () => {
    const g = setup([], [BIG12]);
    boost(g, g.find('p2', 'characters', BIG12), -5000);
    expect(can(g)).toBe(true);
  });

  it('[Trigger] with 0 Life left: all opposing Characters get -3000 power this turn and Emet is played', () => {
    const g = triggerHit(ID, { leader: OTHER_LEADER, life: [ID] }, [V.c5]);
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.life('p1')).toBe(0);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(6000);
  });

  it('[Trigger] with 1 or more Life left: the power drops but Emet is not played', () => {
    const g = triggerHit(ID, { leader: OTHER_LEADER, life: [ID, V.c1] }, [V.c5]);
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(4000);
  });

  it('the power drop ends with the turn', () => {
    const g = triggerHit(ID, { leader: OTHER_LEADER, life: [ID, V.c1] }, [V.c5]);
    g.act({ type: 'trigger', activate: true });
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(4000);
    expectDecision(g, 'main', 'p2');
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });

  it('a played Emet (0 Life) still obeys the attack restriction', () => {
    const g = game(
      { leader: OTHER_LEADER, characters: [ID], life: [] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
    );
    expect(canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(false);
  });
});
