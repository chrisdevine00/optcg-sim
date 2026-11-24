/**
 * ST29-003 Kaku (Character, Yellow, cost 4, 5000, Counter +1000, {CP0}/{Egghead}).
 *
 * Card text: "If the number of your Life cards is equal to or less than the number of your opponent's
 * Life cards, this Character gains +1000 power.
 * [Trigger] K.O. up to 1 of your opponent's Characters with a cost of 3 or less."
 *
 * Rules: a permanent effect applies at all times while the Character is on the field (CR 8-1-3-3),
 * so it follows Life counts as they change, on either player's turn; "equal to or less" includes
 * the boundary. The [Trigger] activates only when this card is taken as damage (CR 10-1-5); an
 * activated Trigger that does not play the card sends it to the trash.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  C29,
  declineTrigger,
  fill,
  hand,
  hitLeader,
  ids29,
  inst,
  isMain,
  kind,
  L29,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  theirs,
} from './kit-st29a.ts';

const KAKU = 'ST29-003';

/** p1's Main Phase with Kaku on board; p1 has `mine` Life and p2 has `theirs` Life. */
function onBoard(mineLife: number, theirLife: number) {
  return mine(
    L29.croc,
    { characters: [KAKU], life: fill(C29.c1, mineLife) },
    { life: fill(C29.c1, theirLife) },
  );
}

describe("ST29-003 Kaku: +1000 power while my Life <= the opponent's Life", () => {
  it('printed values: cost 4, 5000 base power, Counter +1000 (more Life than the opponent: no bonus)', () => {
    const g = onBoard(5, 4);
    const k = inst(g, 'p1', 'characters', KAKU);
    expect(g.card(k).cost).toBe(4);
    expect(g.card(k).counter).toBe(1000);
    expect(g.power(k)).toBe(5000);
  });

  it('equal Life counts (4 and 4): the +1000 applies', () => {
    const g = onBoard(4, 4);
    expect(g.power(inst(g, 'p1', 'characters', KAKU))).toBe(6000);
  });

  it('fewer Life than the opponent (3 and 4): the +1000 applies', () => {
    const g = onBoard(3, 4);
    expect(g.power(inst(g, 'p1', 'characters', KAKU))).toBe(6000);
  });

  it('one more Life than the opponent (4 and 3): no bonus', () => {
    const g = onBoard(4, 3);
    expect(g.power(inst(g, 'p1', 'characters', KAKU))).toBe(5000);
  });

  it('both players with 0 Life: 0 is equal to 0, so the bonus applies', () => {
    const g = onBoard(0, 0);
    expect(g.power(inst(g, 'p1', 'characters', KAKU))).toBe(6000);
  });

  it('it follows the Life counts as they change: taking a hit takes me from 4 v 3 to 3 v 3 and turns it on', () => {
    const g = theirs(
      L29.croc,
      { characters: [KAKU], life: fill(C29.c1, 4) },
      { life: fill(C29.c1, 3) },
    );
    const k = inst(g, 'p1', 'characters', KAKU);
    expect(g.power(k)).toBe(5000);
    hitLeader(g);
    declineTrigger(g);
    // The Life card has no [Trigger]: it goes to my hand. Now 3 Life against 3.
    expect(g.life('p1')).toBe(3);
    expect(g.power(k)).toBe(6000);
  });

  it("it also applies during the opponent's turn", () => {
    const g = theirs(
      L29.croc,
      { characters: [KAKU], life: fill(C29.c1, 3) },
      { life: fill(C29.c1, 4) },
    );
    expect(g.power(inst(g, 'p1', 'characters', KAKU))).toBe(6000);
  });

  it('[Trigger] from the Life: offers only opposing Characters with cost 3 or less and K.O.s the chosen one', () => {
    const g = theirs(
      L29.croc,
      { life: [KAKU, ...fill(C29.c1, 3)] },
      { characters: [C29.c1, C29.c3, C29.c4, C29.c7] },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c1, C29.c3].sort());
    pickInst(g, [inst(g, 'p2', 'characters', C29.c3)]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1, C29.c4, C29.c7].sort());
    expect(ids29(g, 'p2', 'trash')).toEqual([C29.c3]);
    // Kaku was not played: it goes to the trash and I took no card into my hand.
    expect(ids29(g, 'p1', 'trash')).toEqual([KAKU]);
    expect(ids29(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([]);
  });

  it('[Trigger] "up to 1": K.O. nothing; Kaku still goes to the trash', () => {
    const g = theirs(L29.croc, { life: [KAKU, ...fill(C29.c1, 3)] }, { characters: [C29.c1] });
    hitLeader(g);
    activateTrigger(g);
    none(g);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
    expect(ids29(g, 'p1', 'trash')).toEqual([KAKU]);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('declining the [Trigger] adds Kaku to my hand and K.O.s nothing', () => {
    const g = theirs(L29.croc, { life: [KAKU, ...fill(C29.c1, 3)] }, { characters: [C29.c1] });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    declineTrigger(g);
    expect(hand(g)).toEqual([KAKU]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
    expect(kind(g)).toBe('main');
  });
});
