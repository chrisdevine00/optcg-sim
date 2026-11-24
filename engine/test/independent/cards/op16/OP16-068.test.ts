/**
 * OP16-068 Trafalgar Law (Character, Purple, cost 4, 3000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[On Play] Add up to 1 DON!! card from your DON!! deck and set it as active.
 * [When Attacking] If your Leader has the {Donquixote Pirates} type, this Character gains +3000 power
 * during this turn."
 *
 * Rules: CR 6-4 (DON!! deck), CR 8-4-4-1 ("up to"), CR 3-9-3 (a DON!! enters the cost area active),
 * RD 89 ([When Attacking] before the Block Step), CR 8-3-3 (condition), CR 6-6-1-3 ("during this turn"),
 * CR 7-1-4-1 (attacker wins on >=). E-Q11: "add up to N DON!!" asks a count.
 */
import { describe, expect, it } from 'vitest';
import { attack, takeMost } from '../../helpers.ts';
import {
  at,
  backAtMain,
  donCountOptions,
  don,
  kind,
  LDR,
  mine,
  noDefence,
  put,
  SCN,
  takeDon,
  toMyNextMain,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const LAW = 'OP16-068';

function played(donActive = 6): TestGame {
  const g = mine(LDR.dp, { hand: [LAW], costArea: { active: donActive, rested: 0 } });
  put(g, LAW);
  return g;
}
function attacking(
  leader: string,
  p2: (string | { card: string; rested: boolean })[] = [],
  target?: string,
): TestGame {
  const g = mine(leader, { characters: [LAW, SCN.c3] }, { characters: p2 });
  attack(
    g,
    at(g, 'p1', 'characters', LAW),
    target ? at(g, 'p2', 'characters', target) : g.leader('p2'),
  );
  return g;
}
const law = (g: TestGame) => g.power(at(g, 'p1', 'characters', LAW));

describe('OP16-068 Trafalgar Law: [On Play] add up to 1 active DON!!; [When Attacking] with a {Donquixote Pirates} Leader +3000 this turn', () => {
  it('[On Play]: adds 1 DON!! from the DON!! deck and it comes in ACTIVE', () => {
    const g = played();
    takeMost(g);
    expect(backAtMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 3, rested: 4, deck: 3 });
  });

  it('"up to 1": the count may be 1 or 0', () => {
    const g = played();
    expect(donCountOptions(g).sort()).toEqual(['0', '1']);
  });

  it('adding 0 adds nothing', () => {
    const g = played();
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ active: 2, rested: 4, deck: 4 });
  });

  it('with an empty DON!! deck nothing is added and no count is asked that exceeds 0', () => {
    const g = played(10);
    // 10 on the field, the DON!! deck is empty: cost 4 leaves 6 active, 4 rested.
    if (kind(g) === 'choose') expect(donCountOptions(g)).not.toContain('1');
    expect(don(g)).toMatchObject({ active: 6, rested: 4, deck: 0 });
  });

  it('[When Attacking] with a {Donquixote Pirates} Leader: +3000 during this turn (3000 -> 6000)', () => {
    const g = attacking(LDR.dp);
    expect(kind(g)).toBe('block');
    expect(law(g)).toBe(6000);
  });

  it('a Leader with {Donquixote Pirates} among several types ({Donquixote Pirates}/{Navy}) counts', () => {
    const g = attacking(LDR.dpNavy);
    expect(law(g)).toBe(6000);
  });

  it('a Leader without the type: no bonus (3000)', () => {
    const g = attacking(LDR.luffy);
    expect(law(g)).toBe(3000);
  });

  it('the +3000 decides a battle: 6000 K.O.s a rested 6000 Character (the attacker wins ties), 3000 would not', () => {
    const win = attacking(LDR.dp, [{ card: SCN.c4, rested: true }], SCN.c4);
    noDefence(win);
    expect(win.zone('p2', 'characters')).toHaveLength(0);
    const lose = attacking(LDR.luffy, [{ card: SCN.c4, rested: true }], SCN.c4);
    noDefence(lose);
    expect(lose.zone('p2', 'characters')).toHaveLength(1);
  });

  it('"during this turn": the bonus lasts for the turn and is gone on my next turn', () => {
    const g = attacking(LDR.dp);
    noDefence(g);
    expect(law(g)).toBe(6000);
    toMyNextMain(g);
    expect(law(g)).toBe(3000);
  });

  it('only when Law attacks: another Character’s attack gives Law nothing', () => {
    const g = mine(LDR.dp, { characters: [LAW, SCN.c3] });
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(law(g)).toBe(3000);
  });
});
