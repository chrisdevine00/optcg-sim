/** ST30-011 Buggy. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, game, PLAIN_BLUE } from './helpers.ts';
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

const ID = 'ST30-011';

/** p2 runs an effect (planted) against p1's Characters; Buggy is on p1's field. */
const removal = (
  action: Record<string, unknown>,
  chars: Parameters<typeof game>[0]['characters'] = [ATMOS],
  buggyRested = false,
) => {
  const g = game(
    { leader: SHC_LEADER, characters: [{ card: ID, rested: buggyRested }, ...(chars ?? [])] },
    { leader: PLAIN_BLUE },
    { turn: 4, activePlayer: 'p2' },
  );
  plantP2(g, action);
  return g;
};
const offered = (g: ReturnType<typeof removal>) => g.legal().some((a) => a.type === 'optional');

describe('ST30-011 Buggy', () => {
  it('has [Blocker]', () => {
    const g = game({ leader: SHC_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("if your Character with 6000 base power would be removed by your opponent's effect, you may rest this Character instead", () => {
    const g = removal(koByName('Atmos'));
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([ATMOS, ID].sort());
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', ATMOS)).rested).toBe(false);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('declining lets the Character be K.O.d and Buggy stays active', () => {
    const g = removal(koByName('Atmos'));
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(trash(g, 'p1')).toEqual([ATMOS]);
  });

  it('a rested Buggy cannot rest again: the replacement is not offered and the Character is K.O.d', () => {
    const g = removal(koByName('Atmos'), [ATMOS], true);
    expect(offered(g)).toBe(false);
    expect(trash(g, 'p1')).toEqual([ATMOS]);
  });

  it('5000 and 7000 base power Characters, Buggy itself and battle K.O.s are not protected', () => {
    const a = removal(koByName('Solitaire'), [P5000]);
    expect(offered(a)).toBe(false);
    expect(trash(a, 'p1')).toEqual([P5000]);
    const b = removal(koByName('Babanuki'), [P7000]);
    expect(offered(b)).toBe(false);
    expect(trash(b, 'p1')).toEqual([P7000]);
    const c = removal(koByName('Buggy'), []);
    expect(offered(c)).toBe(false);
    expect(trash(c, 'p1')).toEqual([ID]);
    const d = koInBattle(
      { leader: SHC_LEADER, characters: [ID, { card: ATMOS, rested: true }] },
      ATMOS,
    );
    expect(offered(d)).toBe(false);
    expect(trash(d, 'p1')).toEqual([ATMOS]);
  });
});
