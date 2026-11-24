/** EB04-034 Charlotte Pudding: [Blocker]; [On Your Opponent's Attack] [Once Per Turn] trash 1: with 4 or more Events in your trash, your Leader or a Character +2000 during this battle. */
import { describe, expect, it } from 'vitest';
import { decline, accept, dec, expectDecision, none, passBlock, pick, V } from './helpers.ts';
import { canPick, EVENT, ids, oppAttack, OTHER_LEADER, rep } from './helpers-eb04g2.ts';

const ID = 'EB04-034';

const attacked = (trash: string[], hand: string[] = [V.c1]) =>
  oppAttack({ leader: OTHER_LEADER, characters: [ID], hand, trash });

describe('EB04-034 Charlotte Pudding', () => {
  it('has [Blocker]', () => {
    const g = attacked(rep(4, EVENT));
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('with 3 Events in the trash plus the trashed Event (4): +2000 to your Leader during this battle', () => {
    const g = attacked(rep(3, EVENT), [EVENT]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENT)]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    passBlock(g);
    g.act({ type: 'endCounter' });
  });

  it('boundary: 3 Events in the trash after the cost is not enough (the trashed card is not an Event)', () => {
    const g = attacked(rep(3, EVENT));
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(ids(g, 'p1', 'trash')).toHaveLength(4);
  });

  it('with 4 Events already in the trash: your Character may be the target; a Character other than Leader/Character is not', () => {
    const g = attacked(rep(4, EVENT));
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(3000);
  });

  it('"up to 1" is not offered: a target must be chosen (a power choice follows an accepted cost) and the cost can be declined', () => {
    const g = attacked(rep(4, EVENT));
    decline(g);
    expect(ids(g, 'p1', 'hand')).toEqual([V.c1]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(dec(g)?.kind).toBe('block');
  });

  it('the bonus can be skipped by choosing no target', () => {
    const g = attacked(rep(4, EVENT));
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: a second attack in the same turn does not offer it again', () => {
    const g = oppAttack(
      { leader: OTHER_LEADER, characters: [ID], hand: [V.c1, V.c1], trash: rep(4, EVENT) },
      [V.c7, V.c6],
    );
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1, 0)]);
    pick(g, [g.leader('p1')]);
    passBlock(g);
    g.act({ type: 'endCounter' });
    while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
  });
});
