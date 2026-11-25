/**
 * OP11-023 Arlong (Character, Green, cost 7, 7000, Counter +1000, Slash, {Fish-Man}/{The Sun
 * Pirates}/{Fish-Man Island}).
 *
 * Card text: "If your Leader has the {Fish-Man} type, you have 3 or less Life cards and your opponent
 * has 5 or more rested cards, give this card in your hand -3 cost. [Trigger] Rest up to 1 of your
 * opponent's Characters with a cost of 4 or less."
 *
 * Rules: a permanent effect that works in the hand (CR 8-1-3-3-3 style cost modifiers on a card in
 * hand, DECISIONS 2026-11-24 "Hand-zone cost permanents"); all three conditions must hold; the
 * Life count is mine, the rested count is the opponent's cards; the reduction applies only in the
 * hand (on the field the cost is the printed 7); [Trigger] "up to 1" with a cost filter on the
 * opponent's Characters (rested or not).
 * Only rested Characters are used to count the opponent's rested cards: whether rested DON!! or the
 * Leader count as "cards" is not asserted (no ruling is quoted for it).
 * Scenery: ST01-001 Luffy (not Fish-Man), OP06-020 Hody Jones ({Fish-Man} Leader, [Activate: Main] only).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  at,
  attack,
  chars,
  don,
  fill,
  hand,
  kind,
  LD_LF,
  mine,
  need,
  noDefence,
  none,
  offeredIds,
  pickInst,
  playRaw,
  theirs,
  trash,
  VAN_LF,
} from './kit-lfa.ts';

const ARLONG = 'OP11-023';
const { marco, sai, hajrudin, kingdew, mohji, thatch } = VAN_LF;
// Costs: marco 3, sai 2, hajrudin 4, kingdew 5, mohji 1.
const rested = (cards: string[]) => cards.map((card) => ({ card, rested: true }));
const FIVE = rested([marco, sai, hajrudin, kingdew, mohji]);

/** p1 holds Arlong; every condition is met unless an option changes it. */
function handGame(
  o: {
    leader?: string;
    myLife?: number;
    oppChars?: ReturnType<typeof rested>;
    active?: number;
  } = {},
) {
  return mine(
    o.leader ?? LD_LF.hody,
    {
      hand: [ARLONG],
      life: fill(marco, o.myLife ?? 3),
      costArea: { active: o.active ?? 10, rested: 0 },
    },
    { characters: o.oppChars ?? FIVE },
  );
}

const costInHand = (g: ReturnType<typeof handGame>) => g.card(at(g, 'p1', 'hand', ARLONG)).cost;

describe('OP11-023 Arlong', () => {
  it('printed values: cost 7, 7000 power, Counter +1000 (conditions not met)', () => {
    const g = handGame({ leader: LD_LF.luffy });
    expect(costInHand(g)).toBe(7);
    expect(g.card(at(g, 'p1', 'hand', ARLONG)).counter).toBe(1000);
  });

  it('{Fish-Man} Leader, 3 Life and 5 rested opposing cards: costs 4 in hand', () => {
    expect(costInHand(handGame())).toBe(4);
  });

  it('boundary: 3 Life is enough (2, 1 and 0 as well); 4 Life is not', () => {
    expect(costInHand(handGame({ myLife: 4 }))).toBe(7);
    expect(costInHand(handGame({ myLife: 3 }))).toBe(4);
    expect(costInHand(handGame({ myLife: 1 }))).toBe(4);
    expect(costInHand(handGame({ myLife: 0 }))).toBe(4);
  });

  it('boundary: 5 rested opposing Characters are enough, 4 are not', () => {
    expect(costInHand(handGame({ oppChars: FIVE }))).toBe(4);
    expect(costInHand(handGame({ oppChars: FIVE.slice(0, 4) }))).toBe(7);
  });

  it('active opposing Characters do not count as rested', () => {
    const mixed = [...FIVE.slice(0, 4), { card: mohji, rested: false }];
    expect(costInHand(handGame({ oppChars: mixed }))).toBe(7);
  });

  it('a Leader without the {Fish-Man} type: no reduction', () => {
    expect(costInHand(handGame({ leader: LD_LF.luffy }))).toBe(7);
  });

  it('with the reduction, 4 active DON!! pay for Arlong, and the cost on the field is 7 again', () => {
    const g = handGame({ active: 4 });
    const a = at(g, 'p1', 'hand', ARLONG);
    expect(g.legal().some((x) => x.type === 'playCard' && x.card === a)).toBe(true);
    playRaw(g, ARLONG);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([ARLONG]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4 });
    expect(g.card(at(g, 'p1', 'characters', ARLONG)).cost).toBe(7);
  });

  it('boundary: 3 active DON!! cannot play the reduced Arlong; without the reduction 4 cannot either', () => {
    const g = handGame({ active: 3 });
    expect(g.legal().some((x) => x.type === 'playCard')).toBe(false);
    const h = handGame({ active: 4, myLife: 4 });
    expect(h.legal().some((x) => x.type === 'playCard')).toBe(false);
  });

  it('[Trigger]: offers the opposing Characters with cost 4 or less (4 yes, 5 no) and rests the chosen one', () => {
    // Thatch (cost 6, the attacker) is not a candidate; Hajrudin (4), Marco (3) are, Kingdew (5) is not.
    const h = theirs(
      LD_LF.hody,
      { life: [ARLONG, marco, marco], characters: [sai] },
      { characters: [thatch, hajrudin, kingdew, marco], life: fill(mohji, 4) },
    );
    attack(h, at(h, 'p2', 'characters', thatch), h.leader('p1'));
    noDefence(h);
    need(h, 'trigger', 'p1');
    activateTrigger(h);
    need(h, 'choose', 'p1');
    expect(offeredIds(h)).toEqual([hajrudin, marco].sort());
    const target = at(h, 'p2', 'characters', hajrudin);
    pickInst(h, [target]);
    expect(h.card(target).rested).toBe(true);
    expect(trash(h)).toEqual([ARLONG]);
  });

  it('[Trigger] never offers my own Characters', () => {
    const h = theirs(
      LD_LF.hody,
      { life: [ARLONG, marco, marco], characters: [sai] },
      { characters: [thatch, hajrudin], life: fill(mohji, 4) },
    );
    attack(h, at(h, 'p2', 'characters', thatch), h.leader('p1'));
    noDefence(h);
    activateTrigger(h);
    need(h, 'choose', 'p1');
    expect(offeredIds(h)).toEqual([hajrudin]);
  });

  it('[Trigger] "up to 1": it may rest nobody; Arlong still goes to the trash', () => {
    const h = theirs(
      LD_LF.hody,
      { life: [ARLONG, marco, marco] },
      { characters: [thatch, hajrudin], life: fill(mohji, 4) },
    );
    attack(h, at(h, 'p2', 'characters', thatch), h.leader('p1'));
    noDefence(h);
    activateTrigger(h);
    need(h, 'choose', 'p1');
    none(h);
    expect(h.card(at(h, 'p2', 'characters', hajrudin)).rested).toBe(false);
    expect(trash(h)).toEqual([ARLONG]);
    expect(hand(h)).toEqual([]);
  });

  it('[Trigger] declined: Arlong goes to my hand and no Character is rested', () => {
    const h = theirs(
      LD_LF.hody,
      { life: [ARLONG, marco, marco] },
      { characters: [thatch, hajrudin], life: fill(mohji, 4) },
    );
    attack(h, at(h, 'p2', 'characters', thatch), h.leader('p1'));
    noDefence(h);
    need(h, 'trigger', 'p1');
    act(h, { type: 'trigger', activate: false });
    expect(hand(h)).toEqual([ARLONG]);
    expect(h.card(at(h, 'p2', 'characters', hajrudin)).rested).toBe(false);
  });
});

void kind;
