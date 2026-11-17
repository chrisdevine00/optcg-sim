/**
 * OP10-114 X.Drake (Character, Yellow, cost 3, 3000, Counter +2000; Drake Pirates / Navy / Supernovas).
 *
 * Card text: "[Activate: Main] You may rest this Character: If the number of your Life cards is equal to
 * or less than the number of your opponent's Life cards, rest up to 1 of your opponent's Characters
 * with a cost of 4 or less."
 *
 * Rules: CR 8-3-1-4 the "you may" rest is an optional cost, paid when activating; CR 4-10-1 a false
 * "if" resolves nothing but the cost stays paid (CR 8-3-1-5); an already rested Character cannot pay
 * "rest this Character" (CR 8-3-1-3); "up to 1" (CR 8-4-4-1). Targets: OP02-116 Yamakaji (cost 3),
 * OP01-018 Hajrudin (cost 4), OP02-006 Kingdew (cost 5).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  activate,
  BLUE,
  canActivate,
  choiceCards,
  choose,
  chooseNone,
  kind,
  LD,
  LEAD,
  myTurn,
  RED,
  rep,
  side,
  V,
  VAN,
} from './kit-d.ts';

const DRAKE = 'OP10-114';

function game(myLife: number, theirLife: number, p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LD.navy, BLUE, { life: rep(BLUE, myLife), characters: [DRAKE], ...p1 }),
    side(LEAD.luffy, RED, {
      life: rep(RED, theirLife),
      characters: [V.yamakaji, VAN.hajrudin, VAN.kingdew],
    }),
  );
}

describe('OP10-114 X.Drake [Activate: Main]: rest this Character: if my Life <= theirs, rest an opposing cost-4-or-less Character', () => {
  it('equal Life (4 vs 4): Drake rests, and only cost 4 or less targets are offered', () => {
    const g = game(4, 4);
    activate(g, g.find('p1', 'characters', DRAKE));
    expect(choiceCards(g)).toEqual([VAN.hajrudin, V.yamakaji].sort());
    choose(g, [g.find('p2', 'characters', VAN.hajrudin)]);
    expect(g.card(g.find('p1', 'characters', DRAKE)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', VAN.hajrudin)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', VAN.kingdew)).rested).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('fewer Life than the opponent (3 vs 4) works too', () => {
    const g = game(3, 4);
    activate(g, g.find('p1', 'characters', DRAKE));
    expect(choiceCards(g)).toEqual([VAN.hajrudin, V.yamakaji].sort());
  });

  it('CR 4-10-1: more Life than the opponent (4 vs 3): nothing is rested, but Drake’s rest was a paid cost', () => {
    const g = game(4, 3);
    activate(g, g.find('p1', 'characters', DRAKE));
    expect(kind(g)).toBe('main');
    expect(g.card(g.find('p1', 'characters', DRAKE)).rested).toBe(true);
    for (const c of g.zone('p2', 'characters')) expect(c.rested).toBe(false);
  });

  it('CR 8-4-4-1: up to 1 may rest nothing', () => {
    const g = game(4, 4);
    activate(g, g.find('p1', 'characters', DRAKE));
    chooseNone(g);
    for (const c of g.zone('p2', 'characters')) expect(c.rested).toBe(false);
  });

  it('CR 8-3-1-3: a rested Drake cannot pay the cost: not offered', () => {
    const g = game(4, 4, { characters: [{ card: DRAKE, rested: true }] });
    expect(canActivate(g, g.find('p1', 'characters', DRAKE))).toBe(false);
  });

  it('only the opponent’s Characters are targets', () => {
    const g = game(4, 4, { characters: [DRAKE, VAN.sai] });
    activate(g, g.find('p1', 'characters', DRAKE));
    expect(choiceCards(g)).not.toContain(VAN.sai);
  });
});
