/**
 * OP17-092 Brogy (Character, Black, cost 5, 5000, Counter +1000, {Giant}/{Elbaph}/{Giant Pirates}).
 *
 * Card text: "This Character gains +12 cost. [On Play] If your Leader has the {Elbaph} type, play up to 1
 * [Dorry] with a cost of 5 or less from your hand or trash. Then, you cannot play Character cards
 * during this turn."
 *
 * Rules: RL-43 / QA-OP17 OP17-092 (the +12 applies only on the field, not in hand, trash or deck),
 * CR 8-3-3 / 4-10-1 (a "Then" after a failed "if" does not resolve), CR 4-10-2 (a "Then" after an
 * "up to" that chose nothing still resolves), CR 4-7-2 ("cannot play"), CR 6-6-1-3 (this turn).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  blockers,
  BLUE,
  cardIds,
  chars,
  kind,
  kw,
  LD,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playCard,
  SCN,
  theirs,
  toMyNextMain,
  trash,
} from './kit-op17b.ts';

const BROGY = 'OP17-092';
const DORRY = 'OP17-085';

/** The Character cards in p1's hand that are legal to play right now. */
function playableCharacters(g: ReturnType<typeof mine>): string[] {
  return g
    .legal()
    .flatMap((a) => (a.type === 'playCard' ? [a.card] : []))
    .map((i) => g.card(i))
    .filter((c) => c.zone === 'hand' && c.cost !== null)
    .map((c) => c.card)
    .filter((id) => id === BLUE || id === SCN.c2 || id === DORRY);
}

describe('OP17-092 Brogy: +12 cost; [On Play] play Dorry, then no Character plays this turn', () => {
  it('+12 cost applies on the field only: cost 5 in hand, 17 on the field', () => {
    const g = mine(LD.elbaph, { hand: [BROGY] });
    expect(g.card(g.find('p1', 'hand', BROGY)).cost).toBe(5);
    playCard(g, BROGY);
    if (kind(g) === 'choose') none(g);
    expect(g.card(at(g, 'p1', 'characters', BROGY)).cost).toBe(17);
  });

  it('with the {Elbaph} Leader (which gives cost 12+ Characters [Blocker]) Brogy has [Blocker] on the field', () => {
    const g = theirs(LD.elbaph, { characters: [BROGY] }, { characters: [SCN.c3] });
    expect(kw(g, at(g, 'p1', 'characters', BROGY))).toContain('Blocker');
    attack(g, g.find('p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', BROGY)]);
  });

  it('plays [Dorry] from hand (cost 5 in hand qualifies) and Dorry enters the field', () => {
    const g = mine(LD.elbaph, { hand: [BROGY, DORRY] });
    playCard(g, BROGY);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DORRY]);
    pickCards(g, [DORRY]);
    // The played card's own [On Play] asks for its partner (an empty "up to" pick): answer it.
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([DORRY, BROGY].sort());
  });

  it('plays [Dorry] from the trash as well', () => {
    const g = mine(LD.elbaph, { hand: [BROGY], trash: [DORRY] });
    playCard(g, BROGY);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([DORRY]);
    pickCards(g, [DORRY]);
    expect(chars(g)).toEqual([DORRY, BROGY].sort());
    expect(trash(g)).toEqual([]);
  });

  it('only a card named [Dorry]: another Character in hand or trash is not offered', () => {
    const g = mine(LD.elbaph, { hand: [BROGY, SCN.c2, DORRY], trash: [SCN.c3] });
    playCard(g, BROGY);
    expect(offeredIds(g)).toEqual([DORRY]);
  });

  it('"Then, you cannot play Character cards during this turn": other Characters in hand become unplayable', () => {
    const g = mine(LD.elbaph, { hand: [BROGY, DORRY, SCN.c2] });
    playCard(g, BROGY);
    pickCards(g, [DORRY]);
    // The played card's own [On Play] asks for its partner (an empty "up to" pick): answer it.
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(playableCharacters(g)).toEqual([]);
  });

  it('the restriction applies even when no Dorry is played ("up to 1" chosen as none)', () => {
    const g = mine(LD.elbaph, { hand: [BROGY, DORRY, SCN.c2] });
    playCard(g, BROGY);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(playableCharacters(g)).toEqual([]);
  });

  it('the restriction applies when there is no Dorry anywhere', () => {
    const g = mine(LD.elbaph, { hand: [BROGY, SCN.c2] });
    playCard(g, BROGY);
    if (kind(g) === 'choose') none(g);
    expect(playableCharacters(g)).toEqual([]);
  });

  it('a Leader without the {Elbaph} type: nothing is played and the "Then" restriction does not apply', () => {
    const g = mine(LD.neutral, { hand: [BROGY, DORRY, SCN.c2] });
    playCard(g, BROGY);
    if (kind(g) === 'choose') none(g);
    expect(chars(g)).toEqual([BROGY]);
    expect(playableCharacters(g)).toContain(SCN.c2);
  });

  it('the restriction lasts this turn only: Characters can be played on my next turn', () => {
    const g = mine(LD.elbaph, { hand: [BROGY, SCN.c2] });
    playCard(g, BROGY);
    if (kind(g) === 'choose') none(g);
    toMyNextMain(g);
    expect(playableCharacters(g)).toContain(SCN.c2);
    void cardIds;
  });
});
