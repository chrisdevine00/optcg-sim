/**
 * OP16-056 Mr.3(Galdino) (Character, Blue, cost 4, 5000, Counter +1000, {Impel Down}/{Former Baroque Works}).
 *
 * Card text: "[Activate: Main] You may trash this Character: Draw 2 cards, and up to 1 of your
 * opponent's Characters with a cost of 9 or less cannot attack until the end of your opponent's next
 * End Phase."
 *
 * Rules: CR 8-3-1 (cost: trash this Character; it is not a K.O., RD 109), CR 4-5-3, CR 8-4-4-1
 * ("up to"), RL-11 ("until the end of your opponent's next End Phase": the whole of the opponent's next
 * turn, ending at CR 6-6-1-2), CR 1-3-3 (a prohibition beats a permission).
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import {
  abilities,
  at,
  BAT,
  BLUE,
  canAttackAnything,
  choices,
  declineChoice,
  deck,
  fill,
  hand,
  inst,
  kind,
  LDR,
  mine,
  need,
  offeredNow,
  pickInst,
  SCN,
  trash,
  useAbility,
  backAtMain,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const MR3 = 'OP16-056';
const TOP = [SCN.c7, SCN.c8, ...fill(BLUE, 8)];
const mr3 = (g: TestGame) => at(g, 'p1', 'characters', MR3);

function start(p2: string[], own: (string | { card: string; rested: boolean })[] = [MR3]) {
  return mine(LDR.luffy, { characters: own, deck: TOP }, { characters: p2 });
}

describe('OP16-056 Mr.3(Galdino): [Activate: Main] trash this: draw 2; an opposing Character with cost 9 or less cannot attack until the end of the opponent’s next End Phase', () => {
  it('trashes itself as the cost, draws 2, and locks the chosen Character', () => {
    const g = start([SCN.c3]);
    useAbility(g, mr3(g));
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c3)]);
    expect(backAtMain(g)).toBe(true);
    expect(trash(g)).toEqual([MR3]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g)).toEqual([SCN.c7, SCN.c8].sort());
    expect(deck(g)).toHaveLength(8);
  });

  it('cost boundary: a cost-9 Character is offered, a cost-10 Character is not', () => {
    const g = start(['OP01-070', 'OP17-118', SCN.c3]);
    useAbility(g, mr3(g));
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual(['OP01-070', SCN.c3].sort());
  });

  it('the locked Character cannot attack during the opponent’s next turn; its other Characters and Leader can', () => {
    const g = start([SCN.c3, SCN.c4]);
    useAbility(g, mr3(g));
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c3)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, inst(g, 'p2', 'characters', SCN.c3))).toBe(false);
    expect(canAttackAnything(g, inst(g, 'p2', 'characters', SCN.c4))).toBe(true);
    expect(canAttackAnything(g, g.leader('p2'))).toBe(true);
  });

  it('without the effect the same Character can attack (control)', () => {
    const g = start([SCN.c3]);
    endTurn(g);
    expect(canAttackAnything(g, inst(g, 'p2', 'characters', SCN.c3))).toBe(true);
  });

  it('the lock ends with the opponent’s next End Phase: two turns later it can attack again', () => {
    const g = start([SCN.c3]);
    useAbility(g, mr3(g));
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c3)]);
    endTurn(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, inst(g, 'p2', 'characters', SCN.c3))).toBe(true);
  });

  it('"up to 1": may choose none; the cards are still drawn and nothing is locked', () => {
    const g = start([SCN.c3]);
    useAbility(g, mr3(g));
    declineChoice(g);
    expect(hand(g)).toHaveLength(2);
    endTurn(g);
    expect(canAttackAnything(g, inst(g, 'p2', 'characters', SCN.c3))).toBe(true);
  });

  it('with no opposing Characters the 2 cards are still drawn', () => {
    const g = start([]);
    useAbility(g, mr3(g));
    if (kind(g) === 'choose') declineChoice(g);
    expect(hand(g)).toEqual([SCN.c7, SCN.c8].sort());
    expect(trash(g)).toEqual([MR3]);
  });

  it('only 1 Character is locked even with several candidates', () => {
    const g = start([SCN.c3, SCN.c4]);
    useAbility(g, mr3(g));
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(2);
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c4)]);
    endTurn(g);
    expect(canAttackAnything(g, inst(g, 'p2', 'characters', SCN.c3))).toBe(true);
    expect(canAttackAnything(g, inst(g, 'p2', 'characters', SCN.c4))).toBe(false);
  });

  it('a rested Mr.3 can still activate (the cost is a trash, not a rest)', () => {
    const g = start([SCN.c3], [{ card: MR3, rested: true }]);
    expect(abilities(g, mr3(g))).toHaveLength(1);
  });

  it('must-not-happen: trashing it as a cost is not a K.O. and no one else’s Character is touched', () => {
    const g = start([BAT.cobra0]);
    useAbility(g, mr3(g));
    pickInst(g, [inst(g, 'p2', 'characters', BAT.cobra0)]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });
});
