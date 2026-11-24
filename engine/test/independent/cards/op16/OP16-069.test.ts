/**
 * OP16-069 Donquixote Doflamingo (Character, Purple, cost 7, 8000, no Counter, {Donquixote Pirates}).
 *
 * Card text: "[On Play]/[When Attacking] Add up to 1 DON!! card from your DON!! deck and set it as
 * active."
 *
 * Rules: CR 6-4 (DON!! deck), CR 8-4-4-1 ("up to"), CR 3-9-3 (a DON!! enters active), RD 89 ([When
 * Attacking] activates in the Attack Step), CR 8-1-2 (mandatory: no "may"). E-Q11: "add up to N DON!!"
 * asks a count.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter, takeMost } from '../../helpers.ts';
import {
  at,
  backAtMain,
  donCountOptions,
  don,
  kind,
  LDR,
  mine,
  put,
  SCN,
  takeDon,
  theirs,
  asksDonCount,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const DOFFY = 'OP16-069';

function played(active = 7): TestGame {
  const g = mine(LDR.dp, { hand: [DOFFY], costArea: { active, rested: 0 } });
  put(g, DOFFY);
  return g;
}
function attackWith(card: string, active: number, rested = 0): TestGame {
  const g = mine(LDR.dp, { characters: [DOFFY, SCN.c3], costArea: { active, rested } });
  attack(g, at(g, 'p1', card === DOFFY ? 'characters' : 'characters', card), g.leader('p2'));
  return g;
}

describe('OP16-069 Donquixote Doflamingo: [On Play]/[When Attacking] add up to 1 DON!! from the DON!! deck and set it as active', () => {
  it('[On Play]: adds 1 DON!! and it is ACTIVE', () => {
    const g = played();
    takeMost(g);
    expect(backAtMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 1, rested: 7, deck: 2 });
  });

  it('[On Play] "up to 1": the count may be 1 or 0; 0 adds nothing', () => {
    const g = played();
    expect(donCountOptions(g).sort()).toEqual(['0', '1']);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ active: 0, rested: 7, deck: 3 });
  });

  it('[When Attacking]: adds 1 active DON!! as the attack is declared', () => {
    const g = attackWith(DOFFY, 4, 2);
    expect(asksDonCount(g)).toBe(true);
    takeMost(g);
    expect(don(g)).toMatchObject({ active: 5, rested: 2, deck: 3 });
    expect(kind(g)).toBe('block');
  });

  it('[When Attacking] "up to 1": may add 0', () => {
    const g = attackWith(DOFFY, 4, 2);
    expect(donCountOptions(g).sort()).toEqual(['0', '1']);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ active: 4, rested: 2, deck: 4 });
  });

  it('with an empty DON!! deck nothing is added when attacking', () => {
    const g = attackWith(DOFFY, 10);
    if (asksDonCount(g)) expect(donCountOptions(g)).not.toContain('1');
    expect(don(g)).toMatchObject({ active: 10, deck: 0 });
  });

  it('only when Doflamingo attacks: another Character’s attack adds nothing', () => {
    const g = attackWith(SCN.c3, 4, 2);
    expect(kind(g)).toBe('block');
    expect(don(g)).toMatchObject({ deck: 4 });
  });

  it('it is not an [On Play] effect on the opponent’s turn: a Doflamingo on the field adds nothing when blocking or being attacked', () => {
    const g = theirs(
      LDR.dp,
      { characters: [{ card: DOFFY, rested: true }] },
      { characters: [SCN.c3] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c3), at(g, 'p1', 'characters', DOFFY));
    passBlock(g);
    passCounter(g);
    expect(don(g)).toMatchObject({ deck: 10 });
  });

  it('[When Attacking] also works when the target is a rested Character', () => {
    const g = mine(
      LDR.dp,
      { characters: [DOFFY], costArea: { active: 4, rested: 2 } },
      { characters: [{ card: SCN.c4, rested: true }] },
    );
    attack(g, at(g, 'p1', 'characters', DOFFY), at(g, 'p2', 'characters', SCN.c4));
    takeMost(g);
    expect(don(g)).toMatchObject({ active: 5, rested: 2, deck: 3 });
  });

  it('with DON!! rested and active mixed, the added DON!! is ACTIVE (rested count unchanged)', () => {
    const g = attackWith(DOFFY, 1, 5);
    takeMost(g);
    expect(don(g)).toMatchObject({ active: 2, rested: 5 });
  });
});
