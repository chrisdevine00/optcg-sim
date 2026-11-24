/** OP11-034 Hatchan. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, V } from './helpers.ts';
import { withAbilities, type Ability } from '../../src/testing.ts';
import {
  activate,
  canHit,
  canPick,
  FISH_LEADER,
  MERFOLK,
  mk,
  offeredAb,
  RED_LEADER,
} from './helpers-op11g1.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'OP11-034';
const start = (leader: string = FISH_LEADER, p2chars: string[] = [V.c3, V.c4, V.c1]) =>
  mk({ leader, characters: [ID, MERFOLK.c1] }, { characters: p2chars });

/** Give p1's [Hatchan] card... no: give `card` of p1 a planted [Activate: Main] that rests an opponent Character. */
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

describe('OP11-034 Hatchan', () => {
  it('[Activate: Main]: rests; with a {Fish-Man} Leader, a cost 3 or less opponent Character cannot be rested', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'no-rest');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // cost 3: boundary
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false); // cost 4
    pick(g, [g.find('p2', 'characters', V.c3)]);
    // An effect of ours (planted on [Camie]) cannot rest it ...
    plantRest(g, MERFOLK.c1);
    activate(g, g.find('p1', 'characters', MERFOLK.c1), 'r');
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it("it cannot attack on the opponent's next turn (attacking needs a rest), and the lock ends after that turn", () => {
    const g = start(FISH_LEADER, [V.c3, V.c1]);
    activate(g, g.find('p1', 'characters', ID), 'no-rest');
    pick(g, [g.find('p2', 'characters', V.c3)]);
    g.act({ type: 'endTurn' }); // p2's turn
    const atk = (card: string) =>
      g.isLegal({
        type: 'attack',
        attacker: g.find('p2', 'characters', card),
        target: g.leader('p1'),
        player: 'p2',
      });
    expect(atk(V.c3)).toBe(false);
    expect(atk(V.c1)).toBe(true);
    g.act({ type: 'endTurn' }); // p1's turn
    g.act({ type: 'endTurn' }); // p2's next turn: the lock is gone
    expect(atk(V.c3)).toBe(true);
    expect(canHit(g, g.find('p1', 'characters', MERFOLK.c1), g.leader('p2'))).toBe(false); // p2's turn
  });

  it('a {Merfolk} Leader satisfies the condition too; "up to 1" may be declined', () => {
    const g = start('OP11-022');
    activate(g, g.find('p1', 'characters', ID), 'no-rest');
    none(g);
    expect(dec(g)?.kind).toBe('main');
  });

  it('without a {Fish-Man}/{Merfolk} Leader the rest cost is paid and nothing is protected', () => {
    const g = start(RED_LEADER);
    activate(g, g.find('p1', 'characters', ID), 'no-rest');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(dec(g)?.kind).toBe('main');
    plantRest(g, MERFOLK.c1);
    activate(g, g.find('p1', 'characters', MERFOLK.c1), 'r');
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
  });

  it('cannot be activated while rested', () => {
    const g = mk({ leader: FISH_LEADER, characters: [{ card: ID, rested: true }] });
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'no-rest')).toBe(false);
  });
});
