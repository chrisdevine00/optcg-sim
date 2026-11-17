/**
 * OP17-083 Jinbe (Character, Black, cost 2, 2000, Counter +1000, {Fish-Man}/{Straw Hat Crew}/
 * {Elbaph}).
 *
 * Card text:
 *   "If there is a Character with a cost of 12 or more, this Character gains [Blocker] and
 *    +3000 power. (After your opponent declares an attack, you may rest this card to make it the
 *    new target of the attack.)"
 *
 * Rules: CR 8-1-3-3 (permanent, either player's Character counts); CR 10-1-4 ([Blocker]:
 * active, not the attacked card); RL-43 (current cost, the "+12 cost" of OP17-089 counts on the
 * field).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import { theirTurn } from '../kit.ts';
import { blockOptions, C, FILLER, side, V } from './kit-c.ts';

const ID = 'OP17-083';

function defending(mine: string[], theirs: string[] = [V.kingdew]) {
  return theirTurn(
    side(C.luffy, FILLER, { characters: mine }),
    side(C.shanks, FILLER, { characters: theirs }),
  );
}

describe('OP17-083 Jinbe: with a cost 12+ Character → [Blocker] and +3000 power', () => {
  it('own Saul on the field: Jinbe is 5000 and may block an attack on the Leader', () => {
    const g = defending([ID, C.saul]);
    const jinbe = g.find('p1', 'characters', ID);
    expect(g.power(jinbe)).toBe(5000);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    expect(blockOptions(g)).toEqual([jinbe]);
  });

  it("the opponent's cost 12+ Character also grants it", () => {
    const g = defending([ID], [V.kingdew, C.saul]);
    const jinbe = g.find('p1', 'characters', ID);
    expect(g.power(jinbe)).toBe(5000);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    expect(blockOptions(g)).toEqual([jinbe]);
  });

  it('without a cost 12+ Character: 2000 power and no [Blocker]', () => {
    const g = defending([ID, C.cost10]);
    const jinbe = g.find('p1', 'characters', ID);
    expect(g.power(jinbe)).toBe(2000);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    expect(blockOptions(g)).toEqual([]);
  });

  it('the granted [Blocker] still follows the Blocker rules: a rested Jinbe cannot block', () => {
    const g = defending([{ card: ID, rested: true } as never, C.saul]);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    expect(blockOptions(g)).toEqual([]);
  });

  it('Jinbe cannot block an attack aimed at himself (another card must be attacked)', () => {
    const g = defending([{ card: ID, rested: true } as never, C.saul]);
    attack(g, g.find('p2', 'characters', V.kingdew), g.find('p1', 'characters', ID));
    expect(blockOptions(g)).toEqual([]);
  });

  it('with the granted [Blocker] he can block and take the hit in place of the Leader', () => {
    const g = defending([ID, C.saul]);
    const jinbe = g.find('p1', 'characters', ID);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    g.act({ type: 'block', blocker: jinbe });
    expect(g.card(jinbe).rested).toBe(true);
  });

  it('the keyword shows on the card while the condition holds', () => {
    const g = defending([ID, C.saul]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
    const h = defending([ID]);
    expect(h.card(h.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });
});
