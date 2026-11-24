/** OP16-100 Hallowed Glacier Slash. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  passBlock,
  play,
  takeDamage,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { koBy, YAMATO_LEADER } from './helpers-w3s.ts';

const ID = 'OP16-100';

describe('OP16-100 Hallowed Glacier Slash', () => {
  const start = (leader: string, restedLeader = true, active = 4) =>
    game(
      {
        leader: { card: leader, rested: restedLeader },
        hand: [ID],
        characters: [V.c1],
        costArea: { active, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );

  it('[Main] rest 2 DON!!: after an opposing Character was K.O.’d this turn, set your [Yamato] Leader as active', () => {
    const g = start(YAMATO_LEADER);
    koBy(g, 'p2', PURPLE, 'p1');
    play(g, ID);
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 3 }); // 1 for the Event, 2 for the cost
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('with no opposing Character K.O.’d this turn the cost is paid but the Leader stays rested', () => {
    const g = start(YAMATO_LEADER);
    play(g, ID);
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 3 });
  });

  it('only an opponent’s Character counts: your own K.O.’d Character does not', () => {
    const g = start(YAMATO_LEADER);
    koBy(g, 'p1', V.c1, 'p2');
    play(g, ID);
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('a battle K.O. of an opposing Character counts', () => {
    const g = game(
      {
        leader: { card: YAMATO_LEADER, rested: true },
        hand: [ID],
        characters: [V.c7],
        costArea: { active: 4, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [{ card: PURPLE, rested: true }] },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', V.c7),
      target: g.find('p2', 'characters', PURPLE),
    });
    passBlock(g);
    endCounter(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    play(g, ID);
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('a Leader that is not [Yamato] is not set active', () => {
    const g = start(PLAIN_PURPLE);
    koBy(g, 'p2', PURPLE, 'p1');
    play(g, ID);
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('the "you may" cost can be declined: the Event is trashed, no DON!! beyond its cost is rested', () => {
    const g = start(YAMATO_LEADER);
    koBy(g, 'p2', PURPLE, 'p1');
    play(g, ID);
    decline(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1 });
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('[Counter]: your Leader gains +3000 power during this battle', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    if (g.isLegal({ type: 'optional', accept: false, player: 'p1' } as never))
      g.act({ type: 'optional', accept: false });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    expect(g.power(g.leader('p1'))).toBe(8000);
    expectDecision(g, 'counter');
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
