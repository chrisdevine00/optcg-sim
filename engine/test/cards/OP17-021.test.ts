/** OP17-021 Crone Oil. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, game, PLAIN_BLUE, pick, trash } from './helpers.ts';
import { ids } from './helpers-hancock-rosi.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { ATMOS, RED_LEADER, ROCKSTAR } from './helpers-op17g1.ts';

const ID = 'OP17-021';

describe('OP17-021 Crone Oil', () => {
  /** p2 runs an effect (planted) that K.O.s p1's Characters with this name. */
  const koByName = (name: string, chars: string[] = [ID, ROCKSTAR, ATMOS]) => {
    const g = game(
      { leader: RED_LEADER, characters: chars, costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, {
      ko: { from: 'characters', owner: 'opponent', filter: { name } },
    });
    return g;
  };

  it('a "Red-Haired Pirates" Character that would be removed by an opponent effect stays if you rest 1 of your cards instead', () => {
    const g = koByName('Rockstar');
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([ID, ROCKSTAR, ATMOS].sort());
  });

  it('the cost may be a rested DON!! card instead of the Leader', () => {
    const g = koByName('Rockstar');
    accept(g);
    const donPick = g
      .legal()
      .find((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice)!;
    g.act(donPick);
    expect(don(g, 'p1').rested).toBe(1);
    expect(ids(g, 'p1', 'characters')).toContain(ROCKSTAR);
  });

  it('declining lets the Character be K.O.d', () => {
    const g = koByName('Rockstar');
    decline(g);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([ID, ATMOS].sort());
    expect(trash(g, 'p1')).toEqual([ROCKSTAR]);
  });

  it('protects Crone Oil herself ({Red-Haired Pirates Allies} includes "Red-Haired Pirates")', () => {
    const g = koByName('Crone Oil');
    accept(g);
    pick(g, [g.leader('p1')]);
    expect(ids(g, 'p1', 'characters')).toContain(ID);
  });

  it('does not protect a Character without a "Red-Haired Pirates" type', () => {
    const g = koByName('Atmos');
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([ID, ROCKSTAR].sort());
  });

  it('cannot be used when nothing of yours can be rested', () => {
    const g = game(
      {
        leader: { card: RED_LEADER, rested: true },
        characters: [
          { card: ID, rested: true },
          { card: ROCKSTAR, rested: true },
        ],
        costArea: { active: 0, rested: 2 },
      },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, {
      ko: { from: 'characters', owner: 'opponent', filter: { name: 'Rockstar' } },
    });
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });
});
