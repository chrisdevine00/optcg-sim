/**
 * OP16-117 Black Hole (Event, Yellow, cost 2, {Blackbeard Pirates}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[Main] You may trash 1 card with a [Trigger] from your hand: Negate the effects of up to 1 of
 * your opponent's Characters with a cost of 8 or less during this turn.
 * [Trigger] Add up to 1 {Blackbeard Pirates} type card from your trash to your hand."
 *
 * Rules: CR 8-3-1-3/-4 (costs), CR 8-2 (negation), CR 8-4-4-1 ("up to" allows 0), RL-09 ("during this
 * turn"), CR 10-1-5-3 (a card whose [Trigger] is resolving is in no area, so it is not in the trash).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, endTurn, fill } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  cardOf,
  choiceCards,
  choices,
  choose,
  chooseCards,
  chooseNone,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  mine,
  payWith,
  playEvent,
  SC,
  settleYes,
  skipUnusable,
  theirs,
  trash,
  VAN,
  YL,
} from './kit-a.ts';

const EVENT = 'OP16-117';
const TEACH = 'OP16-119'; // {Blackbeard Pirates}

function played(
  handExtra: string[],
  opp: string[] = [VAN.shiki8, SC.xebec, VAN.marco],
  mineChars: string[] = [],
) {
  const g = mine(
    YL.teach,
    { hand: [EVENT, ...handExtra], costArea: { active: 2, rested: 0 }, characters: mineChars },
    { characters: opp },
  );
  playEvent(g, EVENT, true);
  return g;
}

const negated = (g: ReturnType<typeof mine>, card: string) =>
  !!g.card(g.find('p2', 'characters', card)).negated;

describe('OP16-117 Black Hole: [Main] trash a [Trigger] card: negate a Character with cost 8 or less this turn', () => {
  it('candidates: opposing Characters of cost 8 or less (8 yes, 10 no); the chosen one is negated, the others not', () => {
    const g = played([SC.speed, BLUE]);
    payWith(g, [g.find('p1', 'hand', SC.speed)]);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g).sort()).toEqual([VAN.shiki8, VAN.marco].sort());
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.shiki8)!]);
    settleYes(g, 'p1');
    expect(negated(g, VAN.shiki8)).toBe(true);
    expect(negated(g, VAN.marco)).toBe(false);
    expect(negated(g, SC.xebec)).toBe(false);
    expect(trash(g)).toEqual([EVENT, SC.speed].sort());
  });

  it('only the opponent’s Characters can be chosen, never my own', () => {
    const g = played([SC.speed], [VAN.marco], [SC.flampe]);
    payWith(g, [g.find('p1', 'hand', SC.speed)]);
    expect(choiceCards(g)).toEqual([VAN.marco]);
  });

  it('the cost needs a card WITH a [Trigger]: vanilla cards are not offered, and with none the cost cannot be paid', () => {
    const g = played([SC.speed, BLUE, SC.opera]);
    // After "use", the trash choice offers only the [Trigger] card.
    expect(choiceCards(g)).toEqual([SC.speed]);
    const h = played([BLUE, SC.opera]);
    skipUnusable(h, 'p1');
    expect(negated(h, VAN.marco)).toBe(false);
    expect(kind(h)).toBe('main');
  });

  it('CR 8-3-1-4: declining the "you may" cost trashes nothing and negates nothing', () => {
    const g = mine(
      YL.teach,
      { hand: [EVENT, SC.speed], costArea: { active: 2, rested: 0 } },
      { characters: [VAN.marco] },
    );
    playEvent(g, EVENT, false);
    expect(hand(g)).toEqual([SC.speed]);
    expect(negated(g, VAN.marco)).toBe(false);
  });

  it('"up to 1": after paying, may negate nobody', () => {
    const g = played([SC.speed]);
    payWith(g, [g.find('p1', 'hand', SC.speed)]);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(negated(g, VAN.marco)).toBe(false);
    expect(negated(g, VAN.shiki8)).toBe(false);
  });

  it('a negated [Blocker] cannot block this turn', () => {
    const g = played([SC.speed], [SC.blocker]);
    payWith(g, [g.find('p1', 'hand', SC.speed)]);
    choose(g, [choices(g)[0]!]);
    settleYes(g, 'p1');
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]);
  });

  it('the negation ends with the turn', () => {
    const g = played([SC.speed]);
    payWith(g, [g.find('p1', 'hand', SC.speed)]);
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.marco)!]);
    settleYes(g, 'p1');
    expect(negated(g, VAN.marco)).toBe(true);
    endTurn(g);
    expect(negated(g, VAN.marco)).toBe(false);
  });
});

describe('OP16-117 Black Hole: [Trigger] add up to 1 {Blackbeard Pirates} card from the trash to hand', () => {
  function hit(trashCards: string[]) {
    const g = theirs(YL.teach, { life: [EVENT, ...fill(BLUE, 3)], trash: trashCards });
    hitLeader(g);
    return g;
  }

  it('offers only {Blackbeard Pirates} cards (the Event itself is not in the trash while it resolves)', () => {
    const g = hit([TEACH, SC.bobbin, VAN.marco]);
    activateTrigger(g);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([TEACH]);
    chooseCards(g, [TEACH]);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([TEACH]);
    expect(trash(g)).toEqual([EVENT, SC.bobbin, VAN.marco].sort());
  });

  it('"up to 1": may add nothing', () => {
    const g = hit([TEACH]);
    activateTrigger(g);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([]);
  });

  it('declining the [Trigger] puts Black Hole in hand', () => {
    const g = hit([TEACH]);
    declineTrigger(g);
    expect(hand(g)).toEqual([EVENT]);
    expect(trash(g)).toEqual([TEACH]);
  });
});
