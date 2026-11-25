/**
 * OP10-092 Perona (Character, Black, cost 4, 5000, Counter +1000, {Thriller Bark Pirates}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may place 2 "Thriller Bark Pirates" type cards
 * from your trash at the bottom of your deck in any order: Up to 1 of your Characters other than
 * [Perona] gains +2000 power during this turn."
 *
 * Rules: the cost needs exactly 2 matching cards in the (public) trash; "in any order" is the
 * owner's choice; "other than [Perona]" is a name test, so a second [Perona] is excluded too;
 * [Once Per Turn] (CR 10-2-13); "during this turn" ends with the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  BLUE,
  chr,
  decision,
  deck,
  endTurn,
  kind,
  LD10,
  mine,
  need,
  none,
  offeredAbility,
  offeredIds,
  payHand,
  pickInst,
  rawActivate,
  SC10,
  SC14,
  trash,
} from './kit-op10c.ts';

const ID = 'OP10-092';
const OTHER_PERONA = 'ST12-005'; // Perona, Green, cost 4, 6000, {Thriller Bark Pirates}/{Muggy Kingdom}
const EVENT_TB = 'EB05-049'; // Special Hollow: a black Event of type {Thriller Bark Pirates}

function game(trashCards: string[], chars: string[] = [SC14.c1]) {
  return mine(LD10.plain, {
    characters: [ID, ...chars],
    trash: trashCards,
    deck: [BLUE, BLUE, BLUE],
  });
}

const perona = (g: ReturnType<typeof game>) => at(g, 'p1', 'characters', ID);

/** Pay the "place 2" cost: asked only when more than 2 cards qualify, otherwise forced. */
function payTrash(g: ReturnType<typeof game>, cards: string[]) {
  const d = decision(g);
  if (d?.kind === 'choose' && d.purpose === 'cost') payHand(g, cards);
}

/** Order the placed cards (any order), if asked, then stop at the target pick. */
function settleOrder(g: ReturnType<typeof game>) {
  while (decision(g)?.kind === 'order') {
    const a = g.legal().find((x) => x.type === 'order')!;
    act(g, a as never);
  }
}

describe('OP10-092 Perona [Activate: Main] [Once Per Turn] place 2 {Thriller Bark Pirates} from trash at the bottom: +2000', () => {
  it('pays 2 {Thriller Bark Pirates} cards, places them at the bottom, and gives +2000 to another Character', () => {
    const g = game([SC10.tb4, SC10.tb4b, SC14.c3]);
    rawActivate(g, perona(g));
    payTrash(g, [SC10.tb4, SC10.tb4b]);
    settleOrder(g);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', SC14.c1)]);
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p1', SC14.c1))).toBe(5000);
    expect(trash(g)).toEqual([SC14.c3]);
    const d = deck(g);
    expect(d).toHaveLength(5);
    expect(d.slice(0, 3)).toEqual([BLUE, BLUE, BLUE]);
    expect(d.slice(3).sort()).toEqual([SC10.tb4, SC10.tb4b].sort());
  });

  it('"in any order": both orders of the two placed cards are reachable', () => {
    const seen = new Set<string>();
    for (const first of [0, 1]) {
      const g = game([SC10.tb4, SC10.tb4b]);
      rawActivate(g, perona(g));
      payTrash(g, [SC10.tb4, SC10.tb4b]);
      expect(kind(g)).toBe('order');
      const orders = g.legal().filter((x) => x.type === 'order');
      expect(orders).toHaveLength(2);
      act(g, orders[first] as never);
      settleOrder(g);
      seen.add(deck(g).slice(3).join('>'));
    }
    expect(seen.size).toBe(2);
  });

  it('only 1 {Thriller Bark Pirates} card in the trash: the cost cannot be paid', () => {
    const g = game([SC10.tb4, SC14.c3, SC14.c4]);
    expect(offeredAbility(g, perona(g))).toBe(false);
  });

  it('cards of other types do not count, and an Event of the type does', () => {
    const none2 = game([SC10.tb4, SC14.c3, SC10.dr3]);
    expect(offeredAbility(none2, perona(none2))).toBe(false);
    const g = game([SC10.tb4, EVENT_TB]);
    expect(offeredAbility(g, perona(g))).toBe(true);
    rawActivate(g, perona(g));
    payTrash(g, [SC10.tb4, EVENT_TB]);
    settleOrder(g);
    pickInst(g, [chr(g, 'p1', SC14.c1)]);
    expect(g.power(chr(g, 'p1', SC14.c1))).toBe(5000);
    expect(trash(g)).toEqual([]);
  });

  it('with 3 eligible cards in the trash the player picks which 2 are placed', () => {
    const g = game([SC10.tb4, SC10.tb4b, SC10.tb8]);
    rawActivate(g, perona(g));
    payTrash(g, [SC10.tb4b, SC10.tb8]);
    settleOrder(g);
    none(g);
    expect(trash(g)).toEqual([SC10.tb4]);
  });

  it('"other than [Perona]": Perona herself and another card named [Perona] are not offered', () => {
    const g = game([SC10.tb4, SC10.tb4b], [OTHER_PERONA, SC14.c2]);
    rawActivate(g, perona(g));
    payTrash(g, [SC10.tb4, SC10.tb4b]);
    settleOrder(g);
    expect(offeredIds(g)).toEqual([SC14.c2]);
  });

  it('"up to 1": may choose nothing; the cost is paid and the once per turn is spent', () => {
    const g = game([SC10.tb4, SC10.tb4b, SC10.tb8, SC14.c1]);
    rawActivate(g, perona(g));
    payTrash(g, [SC10.tb4, SC10.tb4b]);
    settleOrder(g);
    none(g);
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p1', SC14.c1))).toBe(3000);
    expect(deck(g)).toHaveLength(5);
    expect(offeredAbility(g, perona(g))).toBe(false);
  });

  it('[Once Per Turn]: after one use it is not offered again, even with 2 more cards in the trash', () => {
    const g = game([SC10.tb4, SC10.tb4b, SC10.tb8, EVENT_TB]);
    rawActivate(g, perona(g));
    payTrash(g, [SC10.tb4, SC10.tb4b]);
    settleOrder(g);
    pickInst(g, [chr(g, 'p1', SC14.c1)]);
    expect(offeredAbility(g, perona(g))).toBe(false);
  });

  it('the +2000 lasts this turn only', () => {
    const g = game([SC10.tb4, SC10.tb4b]);
    rawActivate(g, perona(g));
    payTrash(g, [SC10.tb4, SC10.tb4b]);
    settleOrder(g);
    pickInst(g, [chr(g, 'p1', SC14.c1)]);
    expect(g.power(chr(g, 'p1', SC14.c1))).toBe(5000);
    endTurn(g);
    expect(g.power(chr(g, 'p1', SC14.c1))).toBe(3000);
  });

  it('only Characters are targets: the Leader is not offered', () => {
    const g = game([SC10.tb4, SC10.tb4b]);
    rawActivate(g, perona(g));
    payTrash(g, [SC10.tb4, SC10.tb4b]);
    settleOrder(g);
    expect(offeredIds(g)).toEqual([SC14.c1]);
  });
});
