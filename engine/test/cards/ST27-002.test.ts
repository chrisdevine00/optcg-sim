/** ST27-002 Catarina Devon. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, trash, V } from './helpers.ts';
import {
  activate,
  BP_LEADER,
  canPick,
  koByBattle,
  mk,
  NOT_BP_LEADER,
  offeredAb,
} from './helpers-st2627.ts';

const ID = 'ST27-002';
const start = (leader: string, opp: string[] = [V.c3, V.c1]) =>
  mk({ leader, characters: [ID, V.c2] }, { characters: opp });
const me = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);

describe('ST27-002 Catarina Devon', () => {
  it('[Activate: Main] trashes this Character: with a {Blackbeard Pirates} Leader an opposing Character gets -1 cost this turn', () => {
    const g = start(BP_LEADER);
    activate(g, me(g), 'trash-self');
    expect(trash(g, 'p1')).toEqual([ID]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false); // your own Characters
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).cost).toBe(2);
    expect(g.card(g.find('p2', 'characters', V.c1)).cost).toBe(1);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c3)).cost).toBe(3);
  });

  it('a cost 1 Character goes to 0 (no clamp problems) and "up to 1" may pick nothing', () => {
    const g = start(BP_LEADER, [V.c1]);
    activate(g, me(g), 'trash-self');
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.card(g.find('p2', 'characters', V.c1)).cost).toBe(0);
    const h = start(BP_LEADER);
    activate(h, me(h), 'trash-self');
    none(h);
    expect(h.card(h.find('p2', 'characters', V.c3)).cost).toBe(3);
    expect(trash(h, 'p1')).toEqual([ID]);
  });

  it('with a Leader that is not {Blackbeard Pirates} the Character is trashed and nothing happens', () => {
    const g = start(NOT_BP_LEADER);
    expect(offeredAb(g, me(g), 'trash-self')).toBe(true);
    activate(g, me(g), 'trash-self');
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.card(g.find('p2', 'characters', V.c3)).cost).toBe(3);
  });

  it('trashing it as the cost is not a K.O.: nothing is drawn', () => {
    const g = start(BP_LEADER);
    activate(g, me(g), 'trash-self');
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[On K.O.] draws 1 card', () => {
    const g = koByBattle({ leader: BP_LEADER, deck: [V.c4, V.c5] }, ID);
    expect(hand(g, 'p1')).toEqual([V.c4]);
  });
});
