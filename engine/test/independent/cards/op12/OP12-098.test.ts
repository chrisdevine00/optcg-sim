/**
 * OP12-098 Hair Removal Fist (Event, Black, cost 1, {Revolutionary Army}/{Impel Down}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +2000 power during this battle.
 * Then, if you have a "Revolutionary Army" type Character with a cost of 8 or more, that card gains an
 * additional +2000 power during this battle. [Trigger] Draw 1 card and trash 1 card from the top of
 * your deck."
 *
 * Rules: RL-08 ("during this battle"), CR 7-1-3-1-2 (Event [Counter]), CR 4-8-1 ("up to" allows 0),
 * current cost is read (Morley under an RA Leader is 8). READING: "that card" is the Leader or
 * Character chosen in the first sentence (the card named just before), so the chosen card ends at
 * +4000 when I have an RA Character with cost 8 or more. The other reading (the cost-8 Character gains
 * the extra +2000) is noted where it matters.
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  activateTrigger,
  at,
  attack,
  deck,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  LDR,
  need,
  offeredIds,
  passBlock,
  passCounter,
  pickCards,
  SC3,
  SCN,
  theirs,
  topDeck,
  trash,
} from './kit-op12c.ts';

const EVENT = 'OP12-098';

/** p2's 8000-power Character attacks my Leader; I hold the Event with 1 active DON!!. */
function counterStep(
  mineChars: (string | { card: string; rested: boolean })[] = [],
  leader: string = LDR.neutral,
  atkTarget: 'leader' | string = 'leader',
) {
  const g = theirs(
    leader,
    { hand: [EVENT], characters: mineChars as never, costArea: { active: 1, rested: 0 } },
    { characters: [SCN.c6] },
  );
  const target = atkTarget === 'leader' ? g.leader('p1') : at(g, 'p1', 'characters', atkTarget);
  attack(g, at(g, 'p2', 'characters', SCN.c6), target);
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

/** Use the Event on one of my cards (by card id, or the Leader). */
function use(g: ReturnType<typeof counterStep>, target: 'leader' | string) {
  activateCounter(g, g.find('p1', 'hand', EVENT));
  need(g, 'choose', 'p1');
  if (target === 'leader') pickCards(g, [LDR.neutral]);
  else pickCards(g, [target]);
}

describe('OP12-098 Hair Removal Fist: [Counter] +2000, and +2000 more with an RA Character of cost 8+', () => {
  it('no such Character: my Leader gains +2000 (5000 -> 7000) and the 8000 attack connects', () => {
    const g = counterStep();
    use(g, 'leader');
    expect(g.power(g.leader('p1'))).toBe(7000);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('with an RA Character of cost 8 (Sabo): the chosen Leader gains +4000 in total (9000) and holds', () => {
    const g = counterStep([SC3.ra8]);
    use(g, 'leader');
    expect(g.power(g.leader('p1'))).toBe(9000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: an RA Character with cost 7 gives no bonus (+2000 only)', () => {
    const g = counterStep([SC3.ra7]);
    use(g, 'leader');
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a cost-8 Character that is not Revolutionary Army gives no bonus', () => {
    const g = counterStep([SC3.big8]);
    use(g, 'leader');
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('the current cost counts: Morley (4 +4 under a Revolutionary Army Leader) is a cost-8 RA Character', () => {
    const g = counterStep(['OP12-093'], LDR.ra);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    need(g, 'choose', 'p1');
    pickCards(g, [LDR.ra]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the same Morley without the Leader (cost 4) gives no bonus', () => {
    const g = counterStep(['OP12-093'], LDR.neutral);
    use(g, 'leader');
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a Character may be the target: a defending cost-6 Character with the bonus from Sabo gets +4000', () => {
    const g = counterStep([SC3.ra8, { card: SCN.c4, rested: true }], LDR.neutral, SCN.c4);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c4]);
    expect(g.power(at(g, 'p1', 'characters', SCN.c4))).toBe(10000);
    expect(g.power(at(g, 'p1', 'characters', SC3.ra8))).toBe(9000);
  });

  it('only my Leader and Characters are candidates', () => {
    const g = counterStep([SCN.c4]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(SCN.c4);
    expect(offeredIds(g)).not.toContain(SCN.c6);
  });

  it('the boost lasts for the battle only', () => {
    const g = counterStep([SC3.ra8]);
    use(g, 'leader');
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describe('OP12-098 Hair Removal Fist: [Trigger] draw 1 card and trash 1 card from the top of the deck', () => {
  function hit() {
    const g = theirs(
      LDR.neutral,
      { life: [EVENT, SCN.c1, SCN.c1, SCN.c1], deck: topDeck([SCN.c2, SCN.c3]) },
      {},
    );
    hitLeader(g);
    return g;
  }

  it('activating the Trigger draws the top card and trashes the next one from the deck', () => {
    const g = hit();
    activateTrigger(g);
    expect(hand(g)).toEqual([SCN.c2]);
    expect(trash(g)).toEqual([SCN.c3, EVENT].sort());
    expect(deck(g)).toHaveLength(10);
    expect(kind(g)).toBe('main');
  });

  it('declining the Trigger adds the Life card to my hand and draws nothing', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual([EVENT]);
    expect(deck(g)).toHaveLength(12);
  });
});
