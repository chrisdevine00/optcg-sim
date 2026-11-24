/**
 * ST31-002 Jinbe (Character, Red, cost 5, 6000, Counter +1000, {Fish-Man}/{Straw Hat Crew}).
 *
 * Card text: "[Blocker] [On Play] Draw 1 card and play up to 1 {Straw Hat Crew} type card with a cost
 * of 1 from your hand."
 *
 * Rules: "Draw 1" is mandatory (CR 4-5-3) and happens before the play, so the drawn card is in
 * hand for the play; "a cost of 1" is exactly 1; {Straw Hat Crew} is a type match (CR 2-1-4);
 * a played card is paid for by the effect (no DON!!) and enters active; "up to 1" allows 0; the
 * 5-Character limit trashes one of my Characters first (CR 3-7-6-1), which is not a K.O.
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  blockers,
  choices,
  deck,
  decision,
  don,
  hand,
  kind,
  kw,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playCardRaw,
  SL,
  theirs,
  trash,
  attack,
} from './kit-stb5a.ts';

const ID = 'ST31-002';
const SANJI = 'OP04-007'; // Red, cost 1, 3000, {Alabasta}/{Straw Hat Crew}, vanilla
const JINBE2 = 'OP02-033'; // Green, cost 2, 4000, {FILM}/{Fish-Man}/{Straw Hat Crew}, vanilla
const MOHJI = 'OP02-060'; // Blue, cost 1, 3000, {Buggy Pirates}: cost 1, not Straw Hat Crew
const KOM = 'OP01-010'; // Red, cost 1, 3000, {Animal}/{Land of Wano}
const FRANKY = 'OP02-039'; // Green, cost 5, 7000, {FILM}/{Straw Hat Crew}
const MARCO = 'OP01-023';
const SAI = 'OP01-012';
const HAJ = 'OP01-018';
const KING = 'OP02-006';

function start(
  inHand: string[],
  deckCards: string[] = [KOM, ...Array(12).fill(BLUE)],
  chars: string[] = [],
) {
  const g = mine(SL.luffy, { hand: [ID, ...inHand], deck: deckCards, characters: chars });
  playCardRaw(g, ID);
  return g;
}
const fieldIds = (g: ReturnType<typeof start>) =>
  g
    .zone('p1', 'characters')
    .map((c) => c.card)
    .sort();

describe('ST31-002 Jinbe: [Blocker]', () => {
  it('has [Blocker] and can block', () => {
    const g = theirs(SL.luffy, { characters: [ID] }, { characters: [KING] });
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Blocker');
    attack(g, g.find('p2', 'characters', KING), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
  });
});

describe('ST31-002 Jinbe: [On Play] draw 1 card and play up to 1 {Straw Hat Crew} cost-1 card from hand', () => {
  it('draws 1 and offers exactly the {Straw Hat Crew} cards with cost 1 (not cost 2, not cost 5, not other types)', () => {
    const g = start([SANJI, JINBE2, MOHJI, FRANKY, KOM]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SANJI]);
    expect(deck(g)).toHaveLength(12);
  });

  it('plays the chosen card for no DON!!, active, from hand', () => {
    const g = start([SANJI, MARCO]);
    pickInst(g, [g.find('p1', 'hand', SANJI)]);
    expect(atMain(g)).toBe(true);
    expect(fieldIds(g)).toEqual([ID, SANJI].sort());
    expect(g.card(g.find('p1', 'characters', SANJI)).rested).toBe(false);
    expect(don(g).rested).toBe(5);
    expect(hand(g)).toEqual([KOM, MARCO].sort());
  });

  it('the card drawn by the effect is in hand when the play is chosen: a drawn {Straw Hat Crew} cost-1 card is offered', () => {
    const g = start([MARCO], [SANJI, ...Array(12).fill(BLUE)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SANJI]);
    pickInst(g, [g.find('p1', 'hand', SANJI)]);
    expect(fieldIds(g)).toEqual([ID, SANJI].sort());
    expect(hand(g)).toEqual([MARCO]);
  });

  it('"up to 1": may play nothing; the draw still happened', () => {
    const g = start([SANJI]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(fieldIds(g)).toEqual([ID]);
    expect(hand(g)).toEqual([KOM, SANJI].sort());
  });

  it('plays only one even with two candidates', () => {
    const g = start([SANJI, SANJI]);
    pickInst(g, [g.find('p1', 'hand', SANJI)]);
    expect(fieldIds(g)).toEqual([ID, SANJI].sort());
    expect(hand(g).filter((c) => c === SANJI)).toHaveLength(1);
    expect(kind(g)).toBe('main');
  });

  it('with no candidate (cost 2 Straw Hat Crew and cost 1 other type only) nothing is played and the card is still drawn', () => {
    const g = start([JINBE2, MOHJI]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(fieldIds(g)).toEqual([ID]);
    expect(hand(g)).toEqual([JINBE2, MOHJI, KOM].sort());
    expect(deck(g)).toHaveLength(12);
  });

  it('the draw is not optional and not revealed: no prompt precedes the play choice', () => {
    const g = start([SANJI]);
    expect(decision(g)?.kind).toBe('choose');
    expect(deck(g)).toHaveLength(12);
  });

  it('with 5 Characters on my field (Jinbe included) the new Character costs me one of them (rule trash, not a K.O.)', () => {
    const g = start([SANJI], undefined, [MARCO, SAI, HAJ, KING]);
    pickInst(g, [g.find('p1', 'hand', SANJI)]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', SAI)]);
    expect(atMain(g)).toBe(true);
    expect(fieldIds(g)).toEqual([ID, MARCO, HAJ, KING, SANJI].sort());
    expect(trash(g)).toEqual([SAI]);
  });

  it('Straw Hat Crew Characters elsewhere than hand are not offered (the trash, the deck)', () => {
    const g = mine(SL.luffy, { hand: [ID], deck: [KOM, ...Array(12).fill(BLUE)], trash: [SANJI] });
    playCardRaw(g, ID);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).not.toContain(SANJI);
      none(g);
    }
    expect(trash(g)).toEqual([SANJI]);
  });
});
