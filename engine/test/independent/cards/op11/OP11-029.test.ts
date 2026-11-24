/**
 * OP11-029 Charlotte Praline (Character, Green, cost 3, 4000, Counter +1000, {The Sun Pirates}/
 * {Merfolk}/{Fish-Man Island}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] Rest up to 1 of your opponent's Characters with a cost of 1 or less."
 *
 * Rules: [Blocker] lets this Character become the new target of an attack (CR 10-1-1). The cost
 * filter reads the Character's current cost; "1 or less" includes exactly 1. "Up to 1" may be none.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  chr,
  endEmptyIfAsked,
  L11,
  mine,
  N11,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  theirs,
} from './kit-op11a.ts';

const PRALINE = 'OP11-029';

function main(p2: string[], p1chars: string[] = []) {
  return mine(L11.luffy, { hand: [PRALINE], characters: p1chars }, { characters: p2 });
}

describe('OP11-029 Charlotte Praline: [Blocker]; [On Play] rest a Character with cost 1 or less', () => {
  it('printed values: cost 3, 4000, Counter +1000, [Blocker]', () => {
    const g = main([]);
    const p = at(g, 'p1', 'hand', PRALINE);
    expect(g.card(p).cost).toBe(3);
    expect(g.power(p)).toBe(4000);
    expect(g.card(p).counter).toBe(1000);
    expect(g.card(p).keywords).toContain('Blocker');
  });

  it('[Blocker]: she can block an attack on my Leader', () => {
    const g = theirs(L11.luffy, { characters: [PRALINE] }, { characters: [N11.marco] });
    attack(g, chr(g, 'p2', N11.marco), g.leader('p1'));
    expect(blockers(g)).toEqual([chr(g, 'p1', PRALINE)]);
  });

  it('rests the chosen Character with cost 1', () => {
    const g = main([N11.komachiyo, N11.dadan]);
    playRaw(g, PRALINE);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', N11.komachiyo)]);
    expect(g.card(chr(g, 'p2', N11.komachiyo)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', N11.dadan)).rested).toBe(false);
  });

  it('boundary: cost 1 is offered, cost 2 and 3 are not', () => {
    const g = main([N11.komachiyo, N11.sai, N11.marco, N11.dadan]);
    playRaw(g, PRALINE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.dadan, N11.komachiyo].sort());
  });

  it('never offers my own Characters', () => {
    const g = main([N11.komachiyo], [N11.navy1]);
    playRaw(g, PRALINE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.komachiyo]);
  });

  it('"up to 1": may rest no one', () => {
    const g = main([N11.komachiyo]);
    playRaw(g, PRALINE);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(chr(g, 'p2', N11.komachiyo)).rested).toBe(false);
  });

  it('rests only 1 even with two candidates', () => {
    const g = main([N11.komachiyo, N11.dadan]);
    playRaw(g, PRALINE);
    pickInst(g, [chr(g, 'p2', N11.dadan)]);
    expect(g.zone('p2', 'characters').filter((c) => c.rested)).toHaveLength(1);
  });

  it('with no Character of cost 1 or less nothing is rested', () => {
    const g = main([N11.marco, N11.sai]);
    playRaw(g, PRALINE);
    endEmptyIfAsked(g);
    need(g, 'main', 'p1');
    expect(g.zone('p2', 'characters').filter((c) => c.rested)).toHaveLength(0);
  });
});
