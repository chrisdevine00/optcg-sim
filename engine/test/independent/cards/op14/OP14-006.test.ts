/**
 * OP14-006 Shachi & Penguin (Character, cost 2, 2000, Counter +1000, {Heart Pirates}).
 *
 * Card text: "[When Attacking] If this Character has 5000 power or more, give up to 1 of your
 * opponent's Characters -2000 power during this turn."
 *
 * Rules: 3 given DON!! make 2000 + 3000 = 5000 on my turn (RL-13). "Up to 1" may be none (CR
 * 8-4-4-1). "During this turn" ends in the End Phase (rulings duration table). A Character at 0
 * power or below stays on the field: power only matters in battle (CR 3-5, 9-2).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chr,
  endTurn,
  kind,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  S14,
  settleEmpty,
  sorted,
  swing,
} from './kit-op14a.ts';

const SP = 'OP14-006';

function board(don: number, p2chars: string[] = [S14.marco, S14.sai], mychars: string[] = []) {
  return mine(
    LD14.luffy,
    { costArea: { active: 10 - don, rested: 0 }, characters: [{ card: SP, don }, ...mychars] },
    { characters: p2chars },
  );
}

describe('OP14-006 Shachi & Penguin: [When Attacking] with 5000 power, -2000 to an opposing Character', () => {
  it('printed values: cost 2, 2000, Counter +1000; 5000 with 3 DON!!', () => {
    const g = board(3);
    const c = at(g, 'p1', 'characters', SP);
    expect(g.card(c).cost).toBe(2);
    expect(g.power(c)).toBe(5000);
    expect(g.card(c).counter).toBe(1000);
  });

  it('at exactly 5000: offers the opponent Characters (not the Leader, not my own) and gives -2000', () => {
    const g = board(3, [S14.marco, S14.sai], [S14.thatch]);
    swing(g, SP);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.marco, S14.sai].sort());
    pickInst(g, [chr(g, 'p2', S14.marco)]);
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(3000);
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(4000);
    expect(g.power(chr(g, 'p1', S14.thatch))).toBe(8000);
    expect(kind(g)).toBe('block');
  });

  it('boundary: at 4000 power (2 DON!!) nothing is asked and nothing changes', () => {
    const g = board(2);
    swing(g, SP);
    expect(kind(g)).toBe('block');
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(5000);
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(4000);
  });

  it('with no DON!! (2000) nothing happens', () => {
    const g = board(0);
    swing(g, SP);
    expect(kind(g)).toBe('block');
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(5000);
  });

  it('above 5000 (4 DON!! = 6000) the effect still applies', () => {
    const g = board(4);
    swing(g, SP);
    pickInst(g, [chr(g, 'p2', S14.sai)]);
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(2000);
  });

  it('"up to 1": may give it to nobody', () => {
    const g = board(3);
    swing(g, SP);
    none(g);
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(5000);
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(4000);
    expect(kind(g)).toBe('block');
  });

  it('affects one Character only, even with several to choose from', () => {
    const g = board(3, [S14.marco, S14.sai, S14.komachiyo]);
    swing(g, SP);
    pickInst(g, [chr(g, 'p2', S14.marco)]);
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(4000);
    expect(g.power(chr(g, 'p2', S14.komachiyo))).toBe(3000);
  });

  it('power can go to 0 or below without removing the Character from the field', () => {
    const g = board(3, [S14.cobra, S14.dadan]);
    swing(g, SP);
    pickInst(g, [chr(g, 'p2', S14.dadan)]);
    expect(g.power(chr(g, 'p2', S14.dadan))).toBe(0);
    expect(sorted(g, 'p2', 'characters')).toEqual([S14.cobra, S14.dadan].sort());
    expect(sorted(g, 'p2', 'trash')).toEqual([]);
  });

  it('with no opposing Character the effect finds nothing and the battle goes on', () => {
    const g = board(3, []);
    swing(g, SP);
    settleEmpty(g);
    expect(kind(g)).toBe('block');
  });

  it('the -2000 lasts "during this turn": it is gone when the opponent takes their turn', () => {
    const g = board(3);
    swing(g, SP);
    pickInst(g, [chr(g, 'p2', S14.marco)]);
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(3000);
    // Finish the battle with no defence, then end the turn.
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    while (kind(g) === 'trigger') g.act({ type: 'trigger', activate: false });
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(5000);
  });
});
