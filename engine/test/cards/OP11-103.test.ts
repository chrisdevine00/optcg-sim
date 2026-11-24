/** OP11-103 Long-Jaw Neptunian. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { BLUE, dec, expectDecision, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import { activate, canPick, idsOf, mk, offeredAb, SHIRAHOSHI, up } from './helpers-op11g3.ts';

const ID = 'OP11-103';

describe('OP11-103 Long-Jaw Neptunian', () => {
  const start = (
    leader: string = SHIRAHOSHI,
    life: PlayerSpec['life'] = [up(BLUE), BLUE],
    me: PlayerSpec['characters'] = [ID],
  ) => mk({ leader, life, characters: me }, { characters: [V.c3, V.c4] });

  it('[Activate: Main] with [Shirahoshi]: rest this and turn the top Life face-down: K.O. up to 1 opposing Character with cost 3 or less', () => {
    const g = start();
    const me = g.find('p1', 'characters', ID);
    activate(g, me, 'activate');
    expect(g.card(me).rested).toBe(true);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // cost 3: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c4]);
    expect(g.life('p1')).toBe(2);
  });

  it('"up to 1": the cost is paid even if nobody is K.O.\'d', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });

  it('is not offered with a Leader that is not [Shirahoshi] (activation condition)', () => {
    const g = start(PLAIN_BLUE);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('is not offered when the top Life card is face-down', () => {
    const g = start(SHIRAHOSHI, [BLUE, up(BLUE)]);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('is not offered when this Character is already rested', () => {
    const g = start(SHIRAHOSHI, undefined, [{ card: ID, rested: true }]);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('it is not once per turn: after setting it active it can be used again', () => {
    const g = start(SHIRAHOSHI, [up(BLUE), up(BLUE), BLUE]);
    const me = g.find('p1', 'characters', ID);
    activate(g, me, 'activate');
    none(g);
    expect(dec(g)?.kind).toBe('main');
    expect(offeredAb(g, me, 'activate')).toBe(false); // rested now
  });
});
