/**
 * OP17-104 Charlotte Cracker (Character, Yellow, cost 3, 4000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[Your Turn] [On Play] You may rest 2 of your DON!! cards: If your Leader has the {Big Mom
 * Pirates} type, add up to 1 card from the top of your deck to the top of your Life Cards.
 * [Trigger] Play this card."
 *
 * Rules: CR 8-3-1 / 8-3-1-3 (all-or-nothing cost), RD 112 (the cost of an [On Play] may be declined),
 * CR 8-3-3 (failed "if"), CR 4-8-1 ("up to"), CR 8-3-2 / 10-2-11 ([Your Turn]), RD 107 (Life additions
 * go face-down).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  cardIds,
  declineTrigger,
  deck,
  don,
  fill,
  hand,
  hitLeader,
  kind,
  LD,
  lifeCards,
  mine,
  need,
  no,
  playCard,
  SCN,
  theirs,
  unusable,
  yes,
  chars,
} from './kit-op17b.ts';

const CRACKER = 'OP17-104';

function play(leader: string, active = 5, deckCards = [SCN.c8, ...fill(BLUE, 14)]) {
  const g = mine(leader, { hand: [CRACKER], costArea: { active, rested: 0 }, deck: deckCards });
  playCard(g, CRACKER);
  return g;
}

describe('OP17-104 Charlotte Cracker: [Your Turn] [On Play] rest 2 DON!!: Life +1; [Trigger] play this card', () => {
  it('{Big Mom Pirates} Leader: rests 2 DON!! and adds the top deck card to the top of Life, face-down', () => {
    const g = play(LD.bmp);
    need(g, 'optional', 'p1');
    yes(g);
    need(g, 'optional', 'p1'); // "add up to 1 card": a yes/no for the single card
    yes(g);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 0, rested: 5 });
    expect(g.life('p1')).toBe(5);
    expect(lifeCards(g)[0]).toBe(SCN.c8);
    expect(g.zone('p1', 'life')[0]?.faceUp).toBe(false);
    expect(deck(g)).toHaveLength(14);
  });

  it('a Leader without the {Big Mom Pirates} type: the cost may be paid but no Life card is added', () => {
    const g = play(LD.neutral);
    if (kind(g) === 'optional') yes(g);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(15);
  });

  it('declining the DON!! cost: nothing rested, no Life added', () => {
    const g = play(LD.bmp);
    no(g);
    expect(don(g)).toMatchObject({ active: 2, rested: 3 });
    expect(g.life('p1')).toBe(4);
  });

  it('"up to 1": after paying, declining the Life card is allowed (the DON!! stay rested)', () => {
    const g = play(LD.bmp);
    yes(g);
    need(g, 'optional', 'p1');
    no(g);
    expect(g.life('p1')).toBe(4);
    expect(don(g)).toMatchObject({ active: 0, rested: 5 });
  });

  it('CR 8-3-1-3: with only 1 active DON!! left after the play cost, "rest 2" cannot be paid', () => {
    const g = play(LD.bmp, 4);
    unusable(g, 'p1');
    expect(don(g)).toMatchObject({ active: 1, rested: 3 });
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: exactly 2 active DON!! left can pay', () => {
    const g = play(LD.bmp, 5);
    expect(kind(g)).toBe('optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
  });

  it('with an empty deck no Life card can be added', () => {
    const g = play(LD.bmp, 5, []);
    if (kind(g) === 'optional') yes(g);
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g);
    }
    expect(g.life('p1')).toBe(4);
  });

  it("[Trigger]: activated from Life it is played, but [Your Turn] [On Play] does nothing on the opponent's turn", () => {
    const g = theirs(
      LD.bmp,
      { life: [CRACKER, ...fill(BLUE, 3)], costArea: { active: 3, rested: 0 } },
      {},
    );
    hitLeader(g);
    activateTrigger(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([CRACKER]);
    expect(kind(g)).not.toBe('optional');
    expect(g.life('p1')).toBe(3);
    expect(don(g)).toMatchObject({ active: 3, rested: 0 });
  });

  it('[Trigger] declined: the card goes to my hand', () => {
    const g = theirs(LD.bmp, { life: [CRACKER, ...fill(BLUE, 3)] }, {});
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([CRACKER]);
    expect(chars(g)).toEqual([]);
  });
});
