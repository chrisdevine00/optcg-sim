/**
 * OP16-108 Shiryu (Character, Yellow, cost 6, 8000, no Counter, {Blackbeard Pirates}/{Impel Down}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: Add up to 1 {Blackbeard Pirates} type card
 * with a cost of 6 or less from your trash to the top of your Life cards face-up. [Trigger] Draw 2
 * cards."
 *
 * Rules: CR 8-3-1-3 (cost), CR 8-4-4-1 ("up to"), CR 3-10-2-1 (face-up Life), CR 10-1-5 /
 * RD 101-102 ([Trigger]).
 * Scenery in the trash: OP16-102 (Character, cost 1), OP09-082 (Character, cost 4), ST27-003 Kuzan
 * (cost 6), ST27-005 Teach (cost 7), OP16-115 Black Vortex (Event, cost 1, {Blackbeard Pirates}),
 * OP09-094 Peachbeard (type "...Blackbeard Pirates Allies": includes the words but is not the type).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  chars,
  declineTrigger,
  deck,
  deckOf,
  hand,
  hitLeader,
  kind,
  LD16,
  lifeCards,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickCards,
  playIt,
  SC16,
  SCN,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op16c.ts';

const ID = 'OP16-108';
const PIZ = 'OP16-102';
const KUZAN = 'ST27-003';
const TEACH7 = 'ST27-005';
const VORTEX = 'OP16-115';

function start(h: string[], tr: string[], life = 4) {
  const g = mine(LD16.teach, {
    hand: [ID, ...h],
    trash: tr,
    life: Array.from({ length: life }, () => BLUE),
    deck: deckOf([]),
  });
  playIt(g, ID);
  return g;
}

describe('OP16-108 Shiryu: [On Play] may trash 1 card from hand: add a {Blackbeard Pirates} card (cost 6 or less) from the trash to the top of my Life face-up', () => {
  it('trash 1 card, then the chosen card goes on top of my Life, face up', () => {
    const g = start([SCN.c2, BLUE], [SC16.bb4, PIZ]);
    yes(g, 'p1');
    payHand(g, [SCN.c2]);
    need(g, 'choose', 'p1');
    pickCards(g, [SC16.bb4]);
    expect(atMain(g)).toBe(true);
    expect(g.life('p1')).toBe(5);
    const top = g.zone('p1', 'life')[0]!;
    expect(top.card).toBe(SC16.bb4);
    expect(top.faceUp).toBe(true);
    expect(trash(g)).toEqual([SCN.c2, PIZ].sort());
    expect(hand(g)).toEqual([BLUE]);
  });

  it('cost boundary: cost 6 is offered, cost 7 is not; {Blackbeard Pirates} Events count; a lookalike type does not', () => {
    const g = start([BLUE], [KUZAN, TEACH7, VORTEX, SC16.bbAllies3, SC16.wano3]);
    yes(g, 'p1');
    payHand(g, [BLUE]);
    expect(offeredIds(g)).toEqual([KUZAN, VORTEX].sort());
  });

  it('the card trashed as the cost may itself be the one added (it is in the trash by then)', () => {
    const g = start([PIZ], []);
    yes(g, 'p1');
    payHand(g, [PIZ]);
    expect(offeredIds(g)).toEqual([PIZ]);
    pickCards(g, [PIZ]);
    expect(lifeCards(g)[0]).toBe(PIZ);
    expect(trash(g)).toEqual([]);
  });

  it('"up to 1": may add nothing after paying; the trashed card stays trashed', () => {
    const g = start([BLUE], [PIZ]);
    yes(g, 'p1');
    payHand(g, [BLUE]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([BLUE, PIZ].sort());
  });

  it('adds only one card', () => {
    const g = start([BLUE], [PIZ, SC16.bb4]);
    yes(g, 'p1');
    payHand(g, [BLUE]);
    pickCards(g, [PIZ]);
    expect(atMain(g)).toBe(true);
    expect(g.life('p1')).toBe(5);
  });

  it('declining: nothing is trashed and my Life is unchanged', () => {
    const g = start([BLUE], [PIZ]);
    no(g, 'p1');
    expect(hand(g)).toEqual([BLUE]);
    expect(g.life('p1')).toBe(4);
    expect(chars(g)).toEqual([ID]);
  });

  it('an empty hand cannot pay the trash cost', () => {
    const g = start([], [PIZ]);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([PIZ]);
  });

  it('with no eligible card in the trash the cost is paid but nothing is added', () => {
    const g = start([BLUE], [SC16.wano3]);
    yes(g, 'p1');
    payHand(g, [BLUE]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(g.life('p1')).toBe(4);
  });

  it('the card added to Life is not drawn or damaged into hand: my hand does not grow', () => {
    const g = start([BLUE, BLUE], [PIZ]);
    yes(g, 'p1');
    payHand(g, [BLUE]);
    pickCards(g, [PIZ]);
    expect(hand(g)).toEqual([BLUE]);
    expect(deck(g)).toHaveLength(10);
  });
});

describe('OP16-108 Shiryu: [Trigger] draw 2 cards', () => {
  function hit() {
    const g = theirs(
      LD16.teach,
      { life: [ID, BLUE, BLUE, BLUE], deck: deckOf([SCN.c1, SCN.c2]) },
      {},
    );
    hitLeader(g);
    return g;
  }

  it('activating draws exactly 2 cards; Shiryu is trashed', () => {
    const g = hit();
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(hand(g)).toEqual([SCN.c1, SCN.c2].sort());
    expect(trash(g)).toEqual([ID]);
  });

  it('declining: Shiryu goes to my hand and nothing is drawn', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
  });
});
