/** ST30-009 LittleOars Jr. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, expectDecision, game, hand, PLAIN_BLUE } from './helpers.ts';
import {
  ATMOS,
  ids,
  koByName,
  koInBattle,
  P5000,
  P7000,
  plantP2,
  SHC_LEADER,
  trash,
} from './helpers-stg1.ts';

const ID = 'ST30-009';

/** p2 runs an effect (planted) against p1's characters; LittleOars is on p1's field. */
const removal = (action: Record<string, unknown>, chars: string[] = [ATMOS]) => {
  const g = game(
    { leader: SHC_LEADER, characters: [ID, ...chars], deck: [BLUE, BLUE, BLUE] },
    { leader: PLAIN_BLUE },
    { turn: 4, activePlayer: 'p2' },
  );
  plantP2(g, action);
  return g;
};

describe('ST30-009 LittleOars Jr.', () => {
  it("if your Character with 6000 base power would be removed by your opponent's effect, you may trash this Character and draw 1 card instead", () => {
    const g = removal(koByName('Atmos'));
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ATMOS]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('declining lets the Character be K.O.d: LittleOars stays and nothing is drawn', () => {
    const g = removal(koByName('Atmos'));
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([ATMOS]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('a Character with 5000 or 7000 base power is not protected (exact boundary on 6000)', () => {
    const a = removal(koByName('Solitaire'), [P5000]);
    expect(offered(a)).toBe(false);
    expect(trash(a, 'p1')).toEqual([P5000]);
    const b = removal(koByName('Babanuki'), [P7000]);
    expect(offered(b)).toBe(false);
    expect(trash(b, 'p1')).toEqual([P7000]);
  });

  it('LittleOars Jr. itself (2000 base power) is not protected', () => {
    const a = removal(koByName('LittleOars Jr.'), []);
    expect(offered(a)).toBe(false);
    expect(trash(a, 'p1')).toEqual([ID]);
    expect(hand(a, 'p1')).toEqual([]);
  });

  it("a battle K.O. is not replaced (only your opponent's effects)", () => {
    const b = koInBattle(
      { leader: SHC_LEADER, characters: [ID, { card: ATMOS, rested: true }], deck: [BLUE] },
      ATMOS,
    );
    expect(offered(b)).toBe(false);
    expect(trash(b, 'p1')).toEqual([ATMOS]);
    expect(hand(b, 'p1')).toEqual([]);
  });
});

/** True when an optional (replacement) decision is open. */
function offered(game0: ReturnType<typeof removal>): boolean {
  return game0.legal().some((a) => a.type === 'optional');
}
