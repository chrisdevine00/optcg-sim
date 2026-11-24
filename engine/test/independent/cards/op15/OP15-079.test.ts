/**
 * OP15-079 Absalom (Character, Black, cost 4, 5000, Counter +1000, {Thriller Bark Pirates}).
 *
 * Card text: "[On K.O.] Add up to 1 {Thriller Bark Pirates} type card from your trash to your hand.
 * [Trigger] Activate this card's [On K.O.] effect."
 *
 * Rules: CR 10-2-17 / RD 110 ([On K.O.] resolves after the card is in the trash, in battle or by an
 * effect), CR 8-4-4-1 ("up to"), CR 10-1-5 ([Trigger] from Life; if not activated the card goes to hand),
 * rules-digest 105 ("activate this card's effect"). Scenery: OP06-094 Lola (Black, cost 4, {Thriller Bark
 * Pirates}), EB05-049 Special Hollow (Event, {Thriller Bark Pirates}), OP15-115 Impact Dial (Event, [Trigger]
 * K.O. up to 1 Character with cost 4 or less), OP09-077 Gum-Gum Lightning.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  choices,
  declineTrigger,
  deck,
  hand,
  hitLeader,
  inst,
  kind,
  LD15,
  mine,
  need,
  noDefenceUntilTrigger,
  none,
  offeredIds,
  opponentKOs,
  pickInst,
  reachablePickSets,
  RED,
  SC15,
  SCN,
  side,
  theirTurn,
  theirs,
  trash,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ABSALOM = 'OP15-079';
const LOLA = SC15.lola;
const EVENT_TBP = 'EB05-049';
const IMPACT_DIAL = 'OP15-115';
const LIGHTNING = 'OP09-077';

/** p2 K.O.s p1's rested Absalom in battle; p1's trash is `trash`. */
function koed(trashCards: string[]): TestGame {
  const g = theirTurn(
    side(LD15.moria, BLUE, { characters: [{ card: ABSALOM, rested: true }], trash: trashCards }),
    side(LD15.neutral, RED, { characters: [SCN.c3] }),
  );
  attack(g, inst(g, 'p2', 'characters', SCN.c3), inst(g, 'p1', 'characters', ABSALOM));
  passBlock(g);
  passCounter(g);
  return g;
}

describe('OP15-079 Absalom: [On K.O.] add up to 1 {Thriller Bark Pirates} card from trash to hand; [Trigger] activate that effect', () => {
  it('K.O.’d in battle: a {Thriller Bark Pirates} card from my trash goes to my hand', () => {
    const g = koed([LOLA, SCN.c2]);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'trash', LOLA)]);
    expect(hand(g)).toEqual([LOLA]);
    expect(trash(g)).toEqual([ABSALOM, SCN.c2].sort());
    expect(kind(g)).toBe('main');
  });

  it('only {Thriller Bark Pirates} cards are candidates', () => {
    const g = koed([LOLA, SCN.c2, BLUE, SC15.bellamy]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).filter((c) => c !== ABSALOM)).toEqual([LOLA]);
    expect(offeredIds(g)).not.toContain(SCN.c2);
  });

  it('any card type counts: a {Thriller Bark Pirates} Event can be added', () => {
    const g = koed([EVENT_TBP]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(EVENT_TBP);
    pickInst(g, [inst(g, 'p1', 'trash', EVENT_TBP)]);
    expect(hand(g)).toEqual([EVENT_TBP]);
  });

  it('Absalom is already in the trash when the effect resolves, so he can add himself', () => {
    const g = koed([SCN.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ABSALOM]);
    pickInst(g, [inst(g, 'p1', 'trash', ABSALOM)]);
    expect(hand(g)).toEqual([ABSALOM]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('"up to 1": adding nothing is legal', () => {
    const g = koed([LOLA]);
    need(g, 'choose', 'p1');
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ABSALOM, LOLA].sort());
  });

  it('at most one card is added, even with several candidates', () => {
    const g = koed([LOLA, LOLA, EVENT_TBP]);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with no other candidate in the trash only Absalom himself is offered and nothing has to be added', () => {
    const g = koed([SCN.c2, BLUE]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([ABSALOM]);
      none(g);
    }
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([]);
  });

  it('K.O.’d by an opposing effect: the same effect', () => {
    const g = theirTurn(
      side(LD15.moria, BLUE, { characters: [ABSALOM], trash: [LOLA] }),
      side(LD15.neutral, RED, { costArea: { active: 10, rested: 0 }, hand: [LIGHTNING] }),
    );
    opponentKOs(g, inst(g, 'p1', 'characters', ABSALOM));
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'trash', LOLA)]);
    expect(hand(g)).toEqual([LOLA]);
  });

  it('K.O.’d on my own turn (by the opponent’s [Trigger]): the effect still fires', () => {
    const g = mine(
      LD15.moria,
      { characters: [ABSALOM], trash: [LOLA] },
      { life: [IMPACT_DIAL, BLUE, BLUE, BLUE] },
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefenceUntilTrigger(g);
    need(g, 'trigger', 'p2');
    activateTrigger(g);
    need(g, 'choose', 'p2');
    pickInst(g, [inst(g, 'p1', 'characters', ABSALOM)]);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'trash', LOLA)]);
    expect(hand(g)).toEqual([LOLA]);
  });

  it('[Trigger]: revealed from Life it activates the [On K.O.] effect (a card from the trash comes to hand)', () => {
    const g = theirs(LD15.moria, { life: [ABSALOM, BLUE, BLUE, BLUE], trash: [LOLA, SCN.c2] }, {});
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(LOLA);
    expect(choices(g).length).toBeGreaterThanOrEqual(1);
    pickInst(g, [inst(g, 'p1', 'trash', LOLA)]);
    expect(hand(g)).toEqual([LOLA]);
    expect(g.life('p1')).toBe(3);
    expect(trash(g)).toContain(ABSALOM);
  });

  it('[Trigger] declined: Absalom goes to my hand and nothing is added from the trash', () => {
    const g = theirs(LD15.moria, { life: [ABSALOM, BLUE, BLUE, BLUE], trash: [LOLA] }, {});
    hitLeader(g);
    need(g, 'trigger', 'p1');
    declineTrigger(g);
    expect(hand(g)).toEqual([ABSALOM]);
    expect(trash(g)).toEqual([LOLA]);
    expect(deck(g)).toHaveLength(15);
  });
});
