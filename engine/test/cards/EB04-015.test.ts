/** EB04-015 Jinbe. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, dec, don, expectDecision, none, payDon, pick } from './helpers.ts';
import {
  at,
  canPick,
  FISH_LEADER,
  G3,
  G6,
  G7,
  isRested,
  mk,
  RED1,
  RED_LEADER,
} from './helpers-eb04g1.ts';

const ID = 'EB04-015';

describe('EB04-015 Jinbe', () => {
  const start = (leader: string = FISH_LEADER, hand = [G3, G6, G7, RED1], active = 2) =>
    mk({ leader, characters: [ID], hand, costArea: { active, rested: 0 } });
  const koJinbe = (g: ReturnType<typeof start>) => {
    g.state = applyOp(g.state, { op: 'ko', card: at(g, 'p1', 'characters', ID), by: 'p2' }).state;
  };

  it('[On K.O.]: rest 1 of your cards (a DON!!), then with a {Fish-Man} Leader play a green Character of cost 6 or less from your hand', () => {
    const g = start();
    koJinbe(g);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    payDon(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', G6))).toBe(true); // cost 6: boundary
    expect(canPick(g, g.find('p1', 'hand', G3))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', G7))).toBe(false); // cost 7
    expect(canPick(g, g.find('p1', 'hand', RED1))).toBe(false); // not green
    pick(g, [g.find('p1', 'hand', G6)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([G6]);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('the Leader can be the rested card (it is one of "your cards")', () => {
    const g = start();
    koJinbe(g);
    accept(g);
    const leaderPick = g.legal().find((a) => a.type === 'pick' && a.choice === g.leader('p1'));
    expect(leaderPick).toBeDefined();
    g.act(leaderPick!);
    none(g);
    expect(isRested(g, g.leader('p1'))).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
  });

  it('"You may": declining the cost plays nothing and rests nothing', () => {
    const g = start();
    koJinbe(g);
    decline(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
    expect(isRested(g, g.leader('p1'))).toBe(false);
  });

  it('with a Leader that has neither {Fish-Man} nor {Merfolk} the cost is paid but nothing is played', () => {
    const g = start(RED_LEADER);
    koJinbe(g);
    accept(g);
    payDon(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
  });

  it('"up to 1": the play may be skipped', () => {
    const g = start();
    koJinbe(g);
    accept(g);
    payDon(g);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('nothing active to rest (Leader and DON!! all rested): the cost cannot be paid', () => {
    const g = mk({
      leader: { card: FISH_LEADER, rested: true },
      characters: [ID],
      hand: [G3],
      costArea: { active: 0, rested: 2 },
    });
    koJinbe(g);
    // The cost cannot be paid, so the auto is dropped without a question.
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([G3]);
  });
});
