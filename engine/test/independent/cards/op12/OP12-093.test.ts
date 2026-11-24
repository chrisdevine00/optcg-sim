/**
 * OP12-093 Morley (Character, Black, cost 4, 5000, Counter +2000, {Giant}/{Revolutionary Army}).
 *
 * Card text: "If your Leader has the "Revolutionary Army" type, this Character gains +4 cost."
 *
 * Rules: CR 4-9 (a cost modifier changes the current cost, not the printed one), effect conditions on
 * "your Leader" read my Leader only. A K.O. effect that says "cost of N or less" reads the current
 * cost (my OP12-096 Ursa Shock, K.O. cost 4 or less, is used as the probe against an opposing Morley).
 */
import { describe, expect, it } from 'vitest';
import { at, chars, LDR, mine, need, offeredIds, playRaw, SCN } from './kit-op12c.ts';

const ID = 'OP12-093';

/** I play OP12-096 Ursa Shock ([Main] K.O. up to 1 Character with a cost of 4 or less) against p2's Characters. */
function ursa(p2Leader: string, oppChars: string[]) {
  const g = mine(LDR.luffy, { hand: ['OP12-096'] }, { characters: oppChars }, p2Leader);
  playRaw(g, 'OP12-096');
  return g;
}

describe('OP12-093 Morley: +4 cost with a Revolutionary Army Leader', () => {
  it('Revolutionary Army Leader: cost 8', () => {
    const g = mine(LDR.ra, { characters: [ID] });
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(8);
  });

  it('a multi-type Leader including the type (Koala): cost 8', () => {
    const g = mine(LDR.koala, { characters: [ID] });
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(8);
  });

  it('a Leader without the type (Luffy): the printed cost 4', () => {
    const g = mine(LDR.luffy, { characters: [ID] });
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(4);
  });

  it('only the cost changes: power stays 5000 and no keyword is gained', () => {
    const g = mine(LDR.ra, { characters: [ID] });
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(5000);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toEqual([]);
  });

  it('other Characters are not affected', () => {
    const g = mine(LDR.ra, { characters: [ID, SCN.c4] });
    expect(g.card(at(g, 'p1', 'characters', SCN.c4)).cost).toBe(4);
  });

  it('a rested Morley still has cost 8', () => {
    const g = mine(LDR.ra, { characters: [{ card: ID, rested: true } as never] });
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(8);
  });

  it('the bonus is there as soon as Morley is played, with no prompt', () => {
    const g = mine(LDR.ra, { hand: [ID] });
    playRaw(g, ID);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(8);
    expect(g.decider).toBe('p1');
  });

  it('only MY Leader counts: an opposing Revolutionary Army Leader gives nothing', () => {
    const g = mine(LDR.luffy, { characters: [ID] }, {}, LDR.ra);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(4);
  });

  it('a cost-based K.O. reads the current cost: an opposing Morley at cost 8 escapes "cost 4 or less"', () => {
    const g = ursa(LDR.ra, [ID, SCN.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3]);
  });

  it('without the Leader (cost 4) the same K.O. can choose Morley', () => {
    const g = ursa(LDR.luffy, [ID, SCN.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ID, SCN.c3].sort());
    expect(chars(g, 'p2')).toEqual([ID, SCN.c3].sort());
  });
});
