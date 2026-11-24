/**
 * OP17-103 Charlotte Katakuri (Character, Yellow, cost 6, 4000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[Your Turn] [On Play] If your Leader has the {Big Mom Pirates} type, add up to 1 card from
 * the top of your deck to the top of your Life cards. Then, give up to 1 of your opponent's
 * Characters −3000 power during this turn. [Trigger] Play this card."
 *
 * Rules: CR 8-3-2 / 10-2-11 ([Your Turn] is a condition: the effect only works in my own turn),
 * CR 8-3-3 / 4-10-1 (a "Then" after a failed "if" does not resolve), CR 4-10-2 (a "Then" after an
 * "up to" that chose nothing still resolves), RD 107 (Life additions go face-down), CR 6-6-1-3.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  chars,
  choices,
  declineTrigger,
  deck,
  fill,
  hand,
  hitLeader,
  kind,
  LD,
  lifeCards,
  mine,
  mayChooseNone,
  need,
  no,
  none,
  offeredIds,
  pickCards,
  playCard,
  SCN,
  theirs,
  toMyNextMain,
  yes,
  cardIds,
} from './kit-op17b.ts';

const KATA = 'OP17-103';
const OROCHI = 'OP17-066'; // 0 power Character, cost 1

function play(leader: string, opp: string[] = [SCN.c4], deckCards = [SCN.c8, ...fill(BLUE, 14)]) {
  const g = mine(leader, { hand: [KATA], deck: deckCards }, { characters: opp });
  playCard(g, KATA);
  return g;
}

describe('OP17-103 Charlotte Katakuri: [Your Turn] [On Play] Life +1, then -3000; [Trigger] play this card', () => {
  it('{Big Mom Pirates} Leader: adds the top deck card to the top of Life, then gives -3000 to the chosen Character', () => {
    const g = play(LD.bmp);
    need(g, 'optional', 'p1'); // "add up to 1 card": a yes/no for the single card
    yes(g);
    expect(g.life('p1')).toBe(5);
    expect(lifeCards(g)[0]).toBe(SCN.c8);
    expect(g.zone('p1', 'life')[0]?.faceUp).toBe(false);
    expect(deck(g)).toHaveLength(14);
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c4]);
    expect(atMain(g)).toBe(true);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(3000);
  });

  it('a Leader without the {Big Mom Pirates} type: no Life added AND no -3000 (the "Then" is inside the failed "if")', () => {
    const g = play(LD.neutral);
    if (kind(g) !== 'main') {
      // nothing in the effect should be offered; fail loudly if something is
      throw new Error(`Unexpected prompt ${kind(g)}`);
    }
    expect(g.life('p1')).toBe(4);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
    expect(deck(g)).toHaveLength(15);
  });

  it('"up to 1": declining the Life card still resolves the "Then" -3000 (CR 4-10-2)', () => {
    const g = play(LD.bmp);
    need(g, 'optional', 'p1');
    no(g);
    expect(g.life('p1')).toBe(4);
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c4]);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(3000);
  });

  it('"up to 1": the -3000 target may be skipped; the Life card stays added', () => {
    const g = play(LD.bmp);
    yes(g);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.life('p1')).toBe(5);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });

  it('the -3000 lasts this turn only', () => {
    const g = play(LD.bmp);
    yes(g);
    pickCards(g, [SCN.c4]);
    toMyNextMain(g);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });

  it('only opposing Characters are candidates', () => {
    const g = mine(
      LD.bmp,
      { hand: [KATA], characters: [SCN.c2] },
      { characters: [SCN.c4, SCN.c5] },
    );
    playCard(g, KATA);
    yes(g);
    expect(offeredIds(g)).toEqual([SCN.c4, SCN.c5].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('power may go negative: a 0-power Character given -3000 is at -3000 and stays on the field', () => {
    const g = play(LD.bmp, [OROCHI]);
    yes(g);
    pickCards(g, [OROCHI]);
    expect(g.power(at(g, 'p2', 'characters', OROCHI))).toBe(-3000);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('with an empty deck the Life step cannot add a card but the "Then" still resolves', () => {
    const g = play(LD.bmp, [SCN.c4], []);
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g);
    }
    expect(g.life('p1')).toBe(4);
  });

  it("[Trigger]: activated from Life it is played, but [Your Turn] [On Play] does nothing on the opponent's turn", () => {
    const g = theirs(LD.bmp, { life: [KATA, ...fill(BLUE, 3)] }, { characters: [SCN.c4] });
    hitLeader(g);
    activateTrigger(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([KATA]);
    expect(kind(g)).not.toBe('optional');
    expect(g.life('p1')).toBe(3);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });

  it('[Trigger] declined: the card goes to my hand', () => {
    const g = theirs(LD.bmp, { life: [KATA, ...fill(BLUE, 3)] }, {});
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([KATA]);
    expect(chars(g)).toEqual([]);
  });
});
