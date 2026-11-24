/**
 * OP16-073 Borsalino (Character, Purple, cost 7, 8000, no Counter, {Navy}/{Admiral}).
 *
 * Card text: "[On Play] Add up to 1 DON!! card from your DON!! deck and set it as active, and add up to
 * 1 additional DON!! card and rest it. [End of Your Turn] DON!! −2: Set this Character as active.
 * Then, this Character gains [Blocker] until the end of your opponent's next End Phase."
 *
 * Rules: CR 6-4 (DON!! deck), CR 8-4-4-1 ("up to"), CR 3-9-3, CR 8-3-1-6 (DON!! -X, returns to the DON!!
 * deck), CR 6-6-1-1 ([End of Your Turn]), RL-11 ("until the end of your opponent's next End Phase" covers
 * the opponent's whole next turn), CR 10-1-4 ([Blocker]). E-Q11: "add up to N DON!!" asks a count.
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, endTurn, passBlock, passCounter } from '../../helpers.ts';
import {
  at,
  backAtMain,
  donCountOptions,
  don,
  inst,
  kind,
  LDR,
  mine,
  need,
  no,
  payDon,
  put,
  SCN,
  takeDon,
  yes,
  asksDonCount,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const BORSA = 'OP16-073';

function played(active = 7): TestGame {
  const g = mine(LDR.navy, { hand: [BORSA], costArea: { active, rested: 0 } });
  put(g, BORSA);
  return g;
}
/** My Borsalino stands rested at the end of my Main Phase, with `active` / `rested` DON!!. */
function ending(active: number, rested = 0): TestGame {
  return mine(
    LDR.navy,
    { characters: [{ card: BORSA, rested: true }], costArea: { active, rested } },
    { characters: [SCN.c3] },
  );
}

describe('OP16-073 Borsalino: [On Play] add 1 active + 1 rested DON!!; [End of Your Turn] DON!! -2: set this active and give it [Blocker] until the end of the opponent’s next End Phase', () => {
  it('[On Play]: adds 1 DON!! ACTIVE and 1 additional DON!! RESTED', () => {
    const g = played();
    takeDon(g, 1);
    takeDon(g, 1);
    expect(backAtMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 1, rested: 8, deck: 1 });
  });

  it('each part is "up to 1": the first count is 1 or 0, the second count is 1 or 0', () => {
    const g = played();
    expect(donCountOptions(g).sort()).toEqual(['0', '1']);
    takeDon(g, 1);
    expect(donCountOptions(g).sort()).toEqual(['0', '1']);
  });

  it('adding 1 active and 0 additional: only the active one arrives', () => {
    const g = played();
    takeDon(g, 1);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ active: 1, rested: 7, deck: 2 });
  });

  it('adding 0 active and 1 additional: only the rested one arrives', () => {
    const g = played();
    takeDon(g, 0);
    takeDon(g, 1);
    expect(don(g)).toMatchObject({ active: 0, rested: 8, deck: 2 });
  });

  it('with only 1 DON!! left in the DON!! deck only one DON!! can be added in total', () => {
    const g = played(9);
    takeDon(g, 1);
    if (asksDonCount(g)) expect(donCountOptions(g)).not.toContain('1');
    expect(don(g).deck).toBe(0);
  });

  it('[End of Your Turn]: pay DON!! -2: Borsalino is set active and has [Blocker] during the opponent’s turn', () => {
    const g = ending(5);
    endTurn(g);
    need(g, 'optional', 'p1');
    yes(g);
    payDon(g, 2, 'costActive');
    expect(don(g)).toMatchObject({ active: 3, deck: 7 });
    need(g, 'main', 'p2');
    const b = inst(g, 'p1', 'characters', BORSA);
    expect(g.card(b).rested).toBe(false);
    expect(g.card(b).keywords).toContain('Blocker');
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([b]);
  });

  it('declining the DON!! -2: Borsalino stays rested and has no [Blocker]', () => {
    const g = ending(5);
    endTurn(g);
    no(g, 'p1');
    need(g, 'main', 'p2');
    const b = inst(g, 'p1', 'characters', BORSA);
    expect(g.card(b).rested).toBe(true);
    expect(g.card(b).keywords).not.toContain('Blocker');
    expect(don(g).deck).toBe(5);
  });

  it('cost boundary: with only 1 DON!! on my field the DON!! -2 cannot be paid', () => {
    const g = ending(1);
    endTurn(g);
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g, 'p1');
    }
    need(g, 'main', 'p2');
    expect(g.card(inst(g, 'p1', 'characters', BORSA)).rested).toBe(true);
  });

  it('the [Blocker] ends with the opponent’s next End Phase: it is gone in my following turn', () => {
    const g = ending(5);
    endTurn(g);
    yes(g);
    payDon(g, 2, 'costActive');
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.card(inst(g, 'p1', 'characters', BORSA)).keywords).not.toContain('Blocker');
    void at;
    void passBlock;
    void passCounter;
  });
});
