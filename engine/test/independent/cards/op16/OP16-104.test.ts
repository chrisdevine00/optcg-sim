/**
 * OP16-104 Catarina Devon (Character, Yellow, cost 4, 3000, Counter +2000, {Blackbeard Pirates}/{Impel Down}).
 *
 * Card text: "[When Attacking] Select up to 1 of your opponent's Characters. This Character's base power
 * becomes the same as the selected Character's power during this turn. [Trigger] Draw 1 card and
 * play up to 1 {Blackbeard Pirates} type Character with a cost of 1 from your trash."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 6-6-1-3 ("during this turn"), CR 1-3-6 (base power vs given-DON!!
 * bonus), CR 10-1-5 / RD 101-102 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  attack,
  BLUE,
  cardIds,
  chars,
  choices,
  declineTrigger,
  deckOf,
  hand,
  hitLeader,
  kind,
  LD16,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  SC16,
  SCN,
  theirs,
  toMyNextMain,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-104';
const PIZARRO = 'OP16-102'; // {Blackbeard Pirates} Character, cost 1

function swing(o: { don?: number; opp?: (string | { card: string; rested?: boolean })[] } = {}) {
  const g = mine(
    LD16.teach,
    { characters: [{ card: ID, don: o.don ?? 0 }], costArea: { active: 9, rested: 0 } },
    { characters: o.opp ?? [{ card: SCN.c1, rested: true }, SCN.c6, SCN.c4] },
  );
  attack(g, at(g, 'p1', 'characters', ID), at(g, 'p2', 'characters', SCN.c1));
  return g;
}

describe("OP16-104 Catarina Devon: [When Attacking] base power becomes the selected opposing Character's power", () => {
  it("selecting an 8000 Character makes Devon's base power 8000 this turn", () => {
    const g = swing();
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c6]);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(8000);
  });

  it('the given-DON!! bonus stays on top of the new base power (1 DON!! given: 8000 + 1000)', () => {
    const g = swing({ don: 1 });
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(4000);
    pickCards(g, [SCN.c6]);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(9000);
  });

  it("the selection is among the opponent's Characters only (no Leader, none of mine)", () => {
    const g = swing();
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).toEqual([SCN.c1, SCN.c4, SCN.c6].sort());
  });

  it('"up to 1": selecting nobody leaves Devon at 3000', () => {
    const g = swing();
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(3000);
  });

  it('a higher base power decides the battle: Devon (now 8000) K.O.s the rested 3000 target it attacked', () => {
    const g = swing();
    pickCards(g, [SCN.c6]);
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([SCN.c4, SCN.c6].sort());
    expect(atMain(g)).toBe(true);
  });

  it('the new base power lasts this turn only: back to 3000 on my next turn', () => {
    const g = swing();
    pickCards(g, [SCN.c6]);
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    toMyNextMain(g);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(3000);
  });

  it("it is the selected Character's CURRENT power that is copied: selecting the 3000 Character gives 3000", () => {
    const g = swing();
    pickCards(g, [SCN.c1]);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(3000);
  });

  it('the trigger of the attack is [When Attacking]: nothing happens before the attack', () => {
    const g = mine(LD16.teach, { characters: [ID] }, { characters: [SCN.c6] });
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(3000);
    expect(kind(g)).toBe('main');
  });
});

describe('OP16-104 Catarina Devon: [Trigger] draw 1 and play a {Blackbeard Pirates} Character with cost 1 from the trash', () => {
  function hit(tr: string[]) {
    const g = theirs(
      LD16.teach,
      { life: [ID, BLUE, BLUE, BLUE], trash: tr, deck: deckOf([SC16.wano3]) },
      {},
    );
    hitLeader(g);
    return g;
  }

  it('activating: draws 1, plays the {Blackbeard Pirates} cost-1 Character, and Devon is trashed', () => {
    const g = hit([PIZARRO]);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickCards(g, [PIZARRO]);
    expect(chars(g)).toEqual([PIZARRO]);
    expect(hand(g)).toEqual([SC16.wano3]);
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: only cost exactly 1 and type {Blackbeard Pirates}: cost 4, cost-1 non-Blackbeard are not offered', () => {
    const g = hit([PIZARRO, SC16.bb4, SC16.wano1, SC16.bbAllies3]);
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([PIZARRO]);
  });

  it('"up to 1": may play nothing; the draw still happens', () => {
    const g = hit([PIZARRO]);
    activateTrigger(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SC16.wano3]);
  });

  it('with no eligible Character the effect only draws', () => {
    const g = hit([SC16.bb4]);
    activateTrigger(g);
    if (kind(g) === 'choose') none(g);
    expect(hand(g)).toEqual([SC16.wano3]);
    expect(chars(g)).toEqual([]);
  });

  it('declining the [Trigger]: Devon goes to my hand, nothing drawn or played', () => {
    const g = hit([PIZARRO]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(chars(g)).toEqual([]);
  });
});
