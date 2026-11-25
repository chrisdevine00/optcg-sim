/** EB02-011 Arlong. */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import {
  C1,
  canPick,
  don,
  EB_LEADER,
  expectDecision,
  FISH_LEADER,
  mk,
  pick,
  SHC,
  V,
} from './helpers-aeb2g1.ts';
import { dec, none, play } from './helpers.ts';

const ID = 'EB02-011';
const start = (leader: string, p2chars: string[] = [V.c5, V.c6, C1]) =>
  mk(
    { leader, hand: [ID], characters: [SHC.sanji1], costArea: { active: 5, rested: 2 } },
    { characters: p2chars },
  );

const attacks = (g: TestGame, card: string) =>
  g.isLegal({
    type: 'attack',
    attacker: g.find('p2', 'characters', card),
    target: g.leader('p1'),
    player: 'p2',
  });

function plantRest(g: TestGame, card: string): void {
  g.state = withAbilities(g.state, card, [
    {
      id: 'r',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: { rest: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } } }],
    } as Ability,
  ]);
}

describe('EB02-011 Arlong', () => {
  it('{Fish-Man} Leader: gives a rested DON!! to the Leader, then a cost 5 or less opposing Character cannot be rested until the end of their next turn', () => {
    const g = start(FISH_LEADER);
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true); // cost 5: boundary
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false); // cost 6
    expect(canPick(g, g.find('p2', 'characters', C1))).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    g.act({ type: 'endTurn' }); // the opponent's turn: it cannot attack (attacking rests it)
    expect(attacks(g, V.c5)).toBe(false);
    expect(attacks(g, V.c6)).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' }); // the opponent's next turn: the lock is gone
    expect(attacks(g, V.c5)).toBe(true);
  });

  it('{East Blue} Leader qualifies too, and the target cannot be rested by an effect', () => {
    const g = start(EB_LEADER);
    play(g, ID);
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(dec(g)?.kind).toBe('main');
    plantRest(g, SHC.sanji1);
    g.act({ type: 'activate', card: g.find('p1', 'characters', SHC.sanji1), ability: 'r' });
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('any other Leader: nothing is given and nobody is locked (the "Then" is inside the guard)', () => {
    const g = start('ST01-001');
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).don).toBe(0);
    g.act({ type: 'endTurn' });
    expect(attacks(g, V.c5)).toBe(true);
  });

  it('"up to 1": the DON!! may be declined and the Character may be left alone', () => {
    const g = start(FISH_LEADER);
    play(g, ID);
    none(g);
    expect(don(g, 'p1').given).toBe(0);
    none(g);
    expect(dec(g)?.kind).toBe('main');
    g.act({ type: 'endTurn' });
    expect(attacks(g, V.c5)).toBe(true);
  });

  it('declining the DON!! still locks the Character (it does not depend on the give)', () => {
    const g = start(FISH_LEADER);
    play(g, ID);
    none(g);
    pick(g, [g.find('p2', 'characters', C1)]);
    g.act({ type: 'endTurn' });
    expect(attacks(g, C1)).toBe(false);
    expect(attacks(g, V.c5)).toBe(true);
  });
});
