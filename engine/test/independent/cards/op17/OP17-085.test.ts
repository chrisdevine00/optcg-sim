/**
 * OP17-085 Dorry (Character, Black, cost 5, 5000, Counter +1000, {Giant}/{Elbaph}/{Giant Pirates}).
 *
 * Card text: "This Character gains +12 cost. [On Play] If your Leader has the {Elbaph} type, play up to 1
 * [Brogy] with a cost of 5 or less from your hand or trash. Then, you cannot play Character cards
 * during this turn."
 *
 * Rules: RL-43 / QA-OP17 OP17-085 (the +12 applies only on the field, not in hand, trash or deck),
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

const DORRY = 'OP17-085';
const BROGY = 'OP17-092';

/** The Character cards in p1's hand that are legal to play right now. */
function playableCharacters(g: ReturnType<typeof mine>): string[] {
  return g
    .legal()
    .flatMap((a) => (a.type === 'playCard' ? [a.card] : []))
    .map((i) => g.card(i))
    .filter((c) => c.zone === 'hand' && c.cost !== null)
    .map((c) => c.card)
    .filter((id) => id === BLUE || id === SCN.c2 || id === BROGY);
}

describe('OP17-085 Dorry: +12 cost; [On Play] play Brogy, then no Character plays this turn', () => {
  it('+12 cost applies on the field only: cost 5 in hand, 17 on the field', () => {
    const g = mine(LD.elbaph, { hand: [DORRY] });
    expect(g.card(g.find('p1', 'hand', DORRY)).cost).toBe(5);
    playCard(g, DORRY);
    if (kind(g) === 'choose') none(g);
    expect(g.card(at(g, 'p1', 'characters', DORRY)).cost).toBe(17);
  });

  it('with the {Elbaph} Leader (which gives cost 12+ Characters [Blocker]) Dorry has [Blocker] on the field', () => {
    const g = theirs(LD.elbaph, { characters: [DORRY] }, { characters: [SCN.c3] });
    expect(kw(g, at(g, 'p1', 'characters', DORRY))).toContain('Blocker');
    attack(g, g.find('p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', DORRY)]);
  });

  it('plays [Brogy] from hand (cost 5 in hand qualifies) and Brogy enters the field', () => {
    const g = mine(LD.elbaph, { hand: [DORRY, BROGY] });
    playCard(g, DORRY);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BROGY]);
    pickCards(g, [BROGY]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([BROGY, DORRY].sort());
  });

  it('plays [Brogy] from the trash as well', () => {
    const g = mine(LD.elbaph, { hand: [DORRY], trash: [BROGY] });
    playCard(g, DORRY);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([BROGY]);
    pickCards(g, [BROGY]);
    expect(chars(g)).toEqual([BROGY, DORRY].sort());
    expect(trash(g)).toEqual([]);
  });

  it('only a card named [Brogy]: another Character in hand or trash is not offered', () => {
    const g = mine(LD.elbaph, { hand: [DORRY, SCN.c2, BROGY], trash: [SCN.c3] });
    playCard(g, DORRY);
    expect(offeredIds(g)).toEqual([BROGY]);
  });

  it('"Then, you cannot play Character cards during this turn": other Characters in hand become unplayable', () => {
    const g = mine(LD.elbaph, { hand: [DORRY, BROGY, SCN.c2] });
    playCard(g, DORRY);
    pickCards(g, [BROGY]);
    expect(atMain(g)).toBe(true);
    expect(playableCharacters(g)).toEqual([]);
  });

  it('the restriction applies even when no Brogy is played ("up to 1" chosen as none)', () => {
    const g = mine(LD.elbaph, { hand: [DORRY, BROGY, SCN.c2] });
    playCard(g, DORRY);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(playableCharacters(g)).toEqual([]);
  });

  it('the restriction applies when there is no Brogy anywhere', () => {
    const g = mine(LD.elbaph, { hand: [DORRY, SCN.c2] });
    playCard(g, DORRY);
    if (kind(g) === 'choose') none(g);
    expect(playableCharacters(g)).toEqual([]);
  });

  it('a Leader without the {Elbaph} type: nothing is played and the "Then" restriction does not apply', () => {
    const g = mine(LD.neutral, { hand: [DORRY, BROGY, SCN.c2] });
    playCard(g, DORRY);
    if (kind(g) === 'choose') none(g);
    expect(chars(g)).toEqual([DORRY]);
    expect(playableCharacters(g)).toContain(SCN.c2);
  });

  it('the restriction lasts this turn only: Characters can be played on my next turn', () => {
    const g = mine(LD.elbaph, { hand: [DORRY, SCN.c2] });
    playCard(g, DORRY);
    if (kind(g) === 'choose') none(g);
    toMyNextMain(g);
    expect(playableCharacters(g)).toContain(SCN.c2);
    void cardIds;
  });

  it('CR 3-7-6 (effect play into a full Character area): Dorry + 4 others on the field; playing Brogy asks which Character to trash first', () => {
    const g = mine(LD.elbaph, {
      hand: [DORRY, BROGY],
      characters: [SCN.c1, SCN.c2, SCN.c3, SCN.c4],
    });
    // Dorry is the 5th Character, so Brogy would be the 6th.
    playCard(g, DORRY);
    need(g, 'choose', 'p1');
    pickCards(g, [BROGY]);
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('characterLimit');
    pickCards(g, [SCN.c1]);
    expect(chars(g)).toEqual([BROGY, DORRY, SCN.c2, SCN.c3, SCN.c4].sort());
    expect(trash(g)).toEqual([SCN.c1]);
    expect(g.eventsOfType('KO')).toHaveLength(0);
  });
});
