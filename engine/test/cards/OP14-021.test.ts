/** OP14-021 Issho. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  accept,
  BLUE,
  decline,
  dec,
  expectDecision,
  hand,
  none,
  pick,
  PURPLE,
  V,
} from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { canPick } from './helpers-w3s.ts';
import { attack, finishBattle, mk, restedCard } from './helpers-op14g1.ts';

const ID = 'OP14-021';
const STAGE = 'OP02-070';

const start = (p2: Partial<PlayerSpec> = {}, life = [BLUE, PURPLE, V.c1]) =>
  mk(
    { characters: [ID], life },
    {
      characters: [restedCard(V.c1), restedCard(V.c2), V.c3],
      stage: restedCard(STAGE),
      ...p2,
    },
  );

describe('OP14-021 Issho', () => {
  it('[Your Turn] when rested (by attacking): may add the top Life card to your hand; then 1 rested Character or Stage will not become active', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.life('p1')).toBe(2);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    finishBattle(g);
    g.act({ type: 'endTurn' });
    // p2's Refresh Phase: the chosen Character stays rested, the others untap.
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
    expect(g.card(g.find('p2', 'stage', STAGE)).rested).toBe(false);
  });

  it('candidates are rested Characters and Stages only (not active ones, not the Leader)', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    accept(g);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'stage', STAGE))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p2', 'stage', STAGE)]);
    finishBattle(g);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'stage', STAGE)).rested).toBe(true);
  });

  it('declined: no Life card is added and nothing is held back', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.life('p1')).toBe(3);
    finishBattle(g);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('"up to 1": after taking the Life card it may choose nothing', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    accept(g);
    none(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    finishBattle(g);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('must not fire with no Life cards, nor when rested on the opponent turn', () => {
    const none0 = start({}, []);
    attack(none0, none0.find('p1', 'characters', ID));
    expect(dec(none0)?.kind).not.toBe('optional');

    const g = mk(
      { characters: [ID], life: [BLUE, PURPLE] },
      { characters: [V.c1] },
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, { rest: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } });
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(dec(g)?.kind).toBe('main');
    expect(g.life('p1')).toBe(2);
  });
});
