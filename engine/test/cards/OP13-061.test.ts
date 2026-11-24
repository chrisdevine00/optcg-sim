/** OP13-061 Inuarashi. */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, idsOf, mine, OTHER_LEADER, withDon } from './helpers-op13g3.ts';

const ID = 'OP13-061';

describe('OP13-061 Inuarashi', () => {
  const start = (given: boolean, opp: string[], full = false) =>
    mine(
      { leader: given ? withDon(OTHER_LEADER) : OTHER_LEADER, hand: [ID] },
      { characters: opp },
      full ? 9 : 6,
    );

  it('[On Play] with DON!! given: add up to 1 DON!! rested, then K.O. up to 1 opposing Character with a cost of 1 or less', () => {
    const g = start(true, [V.c1, V.c2]);
    play(g, ID);
    const rested = don(g, 'p1').rested;
    addMost(g);
    expect(don(g, 'p1').rested).toBe(rested + 1);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c1]);
  });

  it('with no DON!! given nothing happens: no prompt, no K.O.', () => {
    const g = start(false, [V.c1]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
  });

  it('DON!! given to a Character counts, not only to the Leader', () => {
    const g = mine({ characters: [{ card: V.c4, don: 1 }], hand: [ID] }, { characters: [V.c1] });
    play(g, ID);
    addMost(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c1]);
  });

  it('"Then" is not "if you do": declining the DON!! (count 0) still K.O.s', () => {
    const g = start(true, [V.c1]);
    play(g, ID);
    const d = expectDecision(g, 'choose');
    g.act({ type: 'pick', choice: { option: d.options!.at(-1)!.id } });
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c1]);
  });

  it('with an empty DON!! deck the K.O. is still offered; "up to 1" may K.O. nothing', () => {
    const g = start(true, [V.c1], true);
    play(g, ID);
    expect(dec(g)?.kind).toBe('choose');
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1]);
  });

  it('boundary: a cost-2 Character is not a target (cost of 1 or less)', () => {
    const g = start(true, [V.c2]);
    play(g, ID);
    addMost(g);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });
});
