/**
 * OP10-109 Basil Hawkins (Character, Yellow, cost 4, 5000, Counter +1000, {Hawkins Pirates}/
 * {Supernovas}).
 *
 * Card text: "[On K.O.] Trash up to 1 card from the top of your opponent's Life cards. [Trigger]
 * Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: [On K.O.] (CR 10-2-17); a Life card trashed this way is not damage (no [Trigger]) and
 * goes to the trash, not the hand; [Trigger] (CR 10-2-4) is the damaged player's choice, and a
 * trashed-from-hand card is chosen by its owner.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  BLUE,
  choices,
  declineTrigger,
  deck,
  fill,
  hand,
  hitLeader,
  kind,
  koGame,
  LD10,
  need,
  no,
  pickInst,
  RED,
  SC10,
  SC14,
  skipEmpty,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op10c.ts';

const ID = 'OP10-109';

function ko(p2: { life?: string[] } = {}, leader: string = LD10.plain) {
  return koGame(ID, { leader, p2: { life: p2.life ?? [SC14.c2, RED, RED, RED] } });
}

describe("OP10-109 Hawkins [On K.O.] trash up to 1 of the opponent's Life; [Trigger] draw 2, trash 1", () => {
  it("after being K.O.'d, I may trash the top card of the opponent's Life", () => {
    const g = ko();
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'main', 'p2');
    expect(g.life('p2')).toBe(3);
    expect(trash(g, 'p2')).toEqual([SC14.c2]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('it is the TOP card that is trashed, not another Life card', () => {
    const g = ko({ life: [SC14.c4, SC14.c2, SC14.c3] });
    yes(g, 'p1');
    expect(trash(g, 'p2')).toEqual([SC14.c4]);
    expect(g.zone('p2', 'life').map((c) => c.card)).toEqual([SC14.c2, SC14.c3]);
  });

  it('"up to 1": may trash nothing', () => {
    const g = ko();
    no(g, 'p1');
    need(g, 'main', 'p2');
    expect(g.life('p2')).toBe(4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('with the opponent at 0 Life nothing happens (and nothing is left pending)', () => {
    const g = ko({ life: [] });
    unusable(g, 'p1');
    skipEmpty(g);
    need(g, 'main', 'p2');
    expect(g.life('p2')).toBe(0);
  });

  it('trashing a Life card is not damage: no [Trigger] decision, even for a Life card with a [Trigger]', () => {
    const g = ko({ life: ['OP01-104', RED, RED] });
    yes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(trash(g, 'p2')).toEqual(['OP01-104']);
  });

  it('a K.O. by an effect also triggers it', () => {
    const g = theirs(
      LD10.plain,
      { characters: [ID] },
      { hand: ['OP09-077'], costArea: { active: 10, rested: 0 }, life: fill(RED, 3) },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', 'OP09-077') });
    for (let i = 0; i < 8; i++) {
      if (g.decider === 'p1') break;
      const a =
        g.legal().find((x) => x.type === 'optional' && x.accept) ??
        g.legal().find((x) => x.type === 'pick');
      if (!a) break;
      act(g, a as never);
    }
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(g.life('p2')).toBe(2);
  });

  it('[Trigger]: activating draws 2 cards, then trashes 1 card from hand of my choice', () => {
    const g = theirs(
      LD10.plain,
      { life: [ID, BLUE, BLUE], hand: [SC14.c5], deck: [SC10.dr3, SC10.dr2, BLUE, BLUE] },
      {},
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(3);
    expect(choices(g)).toHaveLength(3);
    // The drawn cards are among the candidates.
    pickInst(g, [g.find('p1', 'hand', SC10.dr3)]);
    expect(hand(g)).toEqual([SC10.dr2, SC14.c5].sort());
    expect(trash(g).sort()).toEqual([ID, SC10.dr3].sort());
    expect(deck(g)).toHaveLength(2);
  });

  it('[Trigger] declined: Hawkins goes to hand and nothing is drawn', () => {
    const g = theirs(LD10.plain, { life: [ID, BLUE, BLUE], hand: [SC14.c5] }, {});
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID, SC14.c5].sort());
    expect(deck(g)).toHaveLength(15);
  });

  it('[Trigger] with an empty hand still draws 2 and then must trash 1 (of the drawn)', () => {
    const g = theirs(
      LD10.plain,
      { life: [ID, BLUE, BLUE], hand: [], deck: [SC10.dr3, SC10.dr2, BLUE] },
      {},
    );
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(2);
    pickInst(g, [g.find('p1', 'hand', SC10.dr2)]);
    expect(hand(g)).toEqual([SC10.dr3]);
  });
});
