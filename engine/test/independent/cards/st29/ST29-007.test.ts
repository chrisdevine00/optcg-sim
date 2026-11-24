/**
 * ST29-007 Tony Tony.Chopper (Character, Yellow, cost 4, 5000, Counter +1000, {Animal}/{Straw Hat
 * Crew}/{Egghead}).
 *
 * Card text: "[On K.O.] You may add 1 card from the top or bottom of your Life cards to your hand: Add up
 * to 1 card from your hand to the top of your Life cards.
 * [Trigger] Up to 1 of your [Monkey.D.Luffy] cards gains +2000 power during this turn."
 *
 * Rules: [On K.O.] fires when this Character is K.O.'d (CR 10-2-?), from battle or an effect; "you
 * may" cost can be declined; an unpayable cost (no Life card) cannot be paid; "up to 1" lets the
 * player add nothing. Taking Life to hand by an effect never offers a [Trigger]. "Your [Monkey.D.
 * Luffy] cards" are Leader and Characters named exactly that; "during this turn" ends with the turn
 * it was applied in.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  act,
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
  need,
  no,
  none,
  offeredIds,
  pickInst,
  theirs,
  unusable,
  yes,
} from './kit-st29a.ts';

const CHOP = 'ST29-007';
const LIFE = [C29.c2, C29.c3, C29.c4, C29.c5]; // top first

/** p2's Main Phase: my rested Chopper, `lifeCards` Life (top first) and `handCards`; p2 has KC too. */
function pos(lifeCards: string[], handCards: string[], extra: string[] = []) {
  return theirs(
    L29.croc,
    { characters: [{ card: CHOP, rested: true }, ...extra], life: lifeCards, hand: handCards },
    { hand: [C29.kingdomCome] },
  );
}

/** p2's Leader (5000) attacks the rested Chopper (5000) and wins; stops at Chopper's [On K.O.]. */
function koByBattle(g: ReturnType<typeof pos>) {
  act(g, { type: 'attack', attacker: g.leader('p2'), target: inst(g, 'p1', 'characters', CHOP) });
  act(g, { type: 'block', blocker: null });
  act(g, { type: 'endCounter' });
}

describe('ST29-007 Chopper [On K.O.]: may add a Life card (top or bottom) to hand, then put a hand card on top of Life', () => {
  it('printed values: cost 4, 5000 power, Counter +1000', () => {
    const g = pos(LIFE, []);
    const c = inst(g, 'p1', 'characters', CHOP);
    expect(g.card(c).cost).toBe(4);
    expect(g.card(c).power).toBe(5000);
    expect(g.card(c).counter).toBe(1000);
  });

  it('K.O.d in battle: take the TOP Life card, then put a hand card on top: Life stays 4, new top is that card', () => {
    const g = pos(LIFE, [C29.c6]);
    koByBattle(g);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: { option: 'top' } });
    // The hand now holds the old hand card and the taken Life card; either may be put back.
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c2, C29.c6].sort());
    pickInst(g, [inst(g, 'p1', 'hand', C29.c6)]);
    expect(ids29(g, 'p1', 'characters')).toEqual([]);
    expect(ids29(g, 'p1', 'trash')).toEqual([CHOP]);
    expect(hand(g)).toEqual([C29.c2]);
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([C29.c6, C29.c3, C29.c4, C29.c5]);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('taking the BOTTOM Life card works the same way and the card put back goes on top', () => {
    const g = pos(LIFE, [C29.c6]);
    koByBattle(g);
    yes(g, 'p1');
    act(g, { type: 'pick', choice: { option: 'bottom' } });
    expect(offeredIds(g)).toEqual([C29.c5, C29.c6].sort());
    pickInst(g, [inst(g, 'p1', 'hand', C29.c5)]);
    // The bottom card was taken and then placed on top.
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([C29.c5, C29.c2, C29.c3, C29.c4]);
    expect(hand(g)).toEqual([C29.c6]);
  });

  it('"up to 1": adding nothing to Life leaves the taken card in hand and Life one lower', () => {
    const g = pos(LIFE, []);
    koByBattle(g);
    yes(g, 'p1');
    act(g, { type: 'pick', choice: { option: 'top' } });
    need(g, 'choose', 'p1');
    none(g);
    expect(hand(g)).toEqual([C29.c2]);
    expect(g.life('p1')).toBe(3);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('"you may": declining changes nothing', () => {
    const g = pos(LIFE, [C29.c6]);
    koByBattle(g);
    no(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([C29.c6]);
    expect(ids29(g, 'p1', 'trash')).toEqual([CHOP]);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('with no Life cards the cost cannot be paid and nothing happens', () => {
    const g = pos([], [C29.c6]);
    koByBattle(g);
    unusable(g, 'p1');
    expect(hand(g)).toEqual([C29.c6]);
    expect(g.life('p1')).toBe(0);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('it also fires when an opponent effect K.O.s it (not only battle)', () => {
    const g = pos(LIFE, [C29.c6]);
    g.act({ type: 'playCard', card: g.find('p2', 'hand', C29.kingdomCome) });
    need(g, 'choose', 'p2');
    pickInst(g, [inst(g, 'p1', 'characters', CHOP)]);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    act(g, { type: 'pick', choice: { option: 'top' } });
    pickInst(g, [inst(g, 'p1', 'hand', C29.c6)]);
    expect(g.zone('p1', 'life')[0]!.card).toBe(C29.c6);
  });

  it('adding Life to hand by this effect never offers a [Trigger] decision', () => {
    // The top Life card is Rob Lucci (has a [Trigger]); taking it to hand through an effect is not damage.
    const g = pos(['ST29-013', C29.c3, C29.c4, C29.c5], []);
    koByBattle(g);
    yes(g, 'p1');
    act(g, { type: 'pick', choice: { option: 'top' } });
    expect(kind(g)).not.toBe('trigger');
    need(g, 'choose', 'p1');
    none(g);
    expect(hand(g)).toEqual(['ST29-013']);
  });
});

describe('ST29-007 Chopper [Trigger]: up to 1 of my [Monkey.D.Luffy] cards gains +2000 power this turn', () => {
  /** p2 hits my Leader; my top Life card is Chopper. Stops at the trigger decision. */
  function hit(leader: string, chars: string[] = []) {
    const g = theirs(leader, { life: [CHOP, ...fill(C29.c1, 3)], characters: chars }, {});
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('with a Monkey.D.Luffy Leader the Leader gains +2000 (7000) this turn and loses it afterwards', () => {
    const g = hit(L29.luffy);
    expect(g.power(g.leader('p1'))).toBe(5000);
    activateTrigger(g);
    // The Leader is the only candidate: the engine either picks it or asks.
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(ids29(g, 'p1', 'trash')).toEqual([CHOP]);
    act(g, { type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Monkey.D.Luffy Character is a legal target too; the Leader (also Luffy) is the alternative', () => {
    const g = hit(L29.luffy, ['ST29-012']);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([L29.luffy, 'ST29-012'].sort());
    pickInst(g, [inst(g, 'p1', 'characters', 'ST29-012')]);
    expect(g.power(inst(g, 'p1', 'characters', 'ST29-012'))).toBe(2000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with no Monkey.D.Luffy card on my side nothing can be boosted: other cards are not offered', () => {
    const g = hit(L29.croc, [C29.c3]);
    activateTrigger(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(g.power(inst(g, 'p1', 'characters', C29.c3))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": the boost may be declined even when a Luffy card exists', () => {
    const g = hit(L29.luffy);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining the [Trigger] adds Chopper to my hand and gives no boost', () => {
    const g = hit(L29.luffy);
    declineTrigger(g);
    expect(hand(g)).toEqual([CHOP]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
