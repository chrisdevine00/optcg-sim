/**
 * OP12-080 Baratie (Stage, Purple, cost 1, {East Blue}).
 *
 * Card text: "[Activate: Main] You may place this Stage at the bottom of the owner's deck: If your Leader
 * is [Sanji], look at 3 cards from the top of your deck; reveal up to 1 Event and add it to your hand.
 * Then, place the rest at the bottom of your deck in any order." "[Trigger] Play this card."
 *
 * Rules: the cost (placing this Stage) is paid on activation and needs the Stage on the field; the
 * "If" after the colon is an effect condition, so the cost is paid even when the Leader is not
 * [Sanji] and then nothing else happens (CR 8-3, 4-10-1); "look at 3" takes the top 3 only; "up to
 * 1" may add none; revealing makes the card public; the rest go to the bottom in an order I choose
 * (the Stage is already at the bottom, so the rest end up below it); a Stage played while I have
 * another Stage trashes the old one (CR 3-8-2).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  at,
  atMain,
  attack,
  deck,
  hand,
  hasEvent,
  kind,
  mayChooseNone,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  passBlock,
  pickCards,
  playRaw,
  reachablePickSets,
  settleOrders,
  sorted,
  tail,
  theirs,
  trash,
  V13,
  W6,
  snap,
  useAbility,
  LW,
} from './kit-w6b.ts';

const BARATIE = 'OP12-080';
const SANJI = 'OP02-026'; // Sanji, Blue/Green, 5000. Its text only fires when a Character with no base effect is played.
const FILL = 'OP02-060';
const EV1 = W6.music1; // Event
const EV2 = W6.beamSword; // Event

/** p1 with the Stage on the field and `top` as the top of a 7-card deck. */
function game(top: string[], leader: string = SANJI) {
  const g = mine(leader, {
    stage: BARATIE,
    deck: [...top, ...Array.from({ length: 7 - top.length }, () => FILL)],
  });
  return g;
}

const stage = (g: ReturnType<typeof game>) => g.zone('p1', 'stage')[0]!.instance;

describe('OP12-080 Baratie: place this Stage at the bottom of the deck; with a [Sanji] Leader look at 3, add up to 1 Event, rest to the bottom', () => {
  it('printed values: Stage, cost 1', () => {
    const g = game([FILL]);
    expect(g.card(stage(g)).cost).toBe(1);
  });

  it('with a [Sanji] Leader: only Events among the top 3 are offered; the pick goes to the hand, revealed; the rest go to the bottom', () => {
    const g = game([V13.sai, EV1, V13.marco, EV2]);
    useAbility(g, stage(g));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EV1]);
    pickCards(g, [EV1]);
    settleOrders(g);
    expect(atMain(g), snap(g)).toBe(true);
    expect(hand(g)).toEqual([EV1]);
    expect(hasEvent(g, 'CardRevealed', { card: EV1 })).toBe(true);
    expect(g.zone('p1', 'stage')).toHaveLength(0);
    // 7 cards + the Stage - the added Event; the 4th card (an Event) was not looked at and is the new top.
    expect(deck(g)).toHaveLength(7);
    expect(deck(g)[0]).toBe(EV2);
    expect(tail(deck(g), 2)).toEqual([V13.marco, V13.sai].sort());
    expect(deck(g)).toContain(BARATIE);
  });

  it('the Stage is placed at the bottom first: the looked-at rest end up below it', () => {
    const g = game([V13.sai, EV1, V13.marco]);
    useAbility(g, stage(g));
    pickCards(g, [EV1]);
    settleOrders(g);
    const d = deck(g);
    expect(d.slice(-3)).toContain(BARATIE);
    expect(d.at(-1)).not.toBe(BARATIE);
    expect(d.at(-2)).not.toBe(BARATIE);
  });

  it('"up to 1": I may add nothing; all 3 looked-at cards go to the bottom', () => {
    const g = game([V13.sai, EV1, V13.marco, EV2]);
    useAbility(g, stage(g));
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(8);
    expect(deck(g)[0]).toBe(EV2);
    expect(tail(deck(g), 3)).toEqual([V13.sai, EV1, V13.marco].sort());
  });

  it('adds at most one Event even when two are among the top 3', () => {
    const g = game([EV1, EV2, V13.marco]);
    useAbility(g, stage(g));
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(EV1)).toBe(true);
    expect(sets.has(EV2)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('looks at 3 cards only: an Event as the 4th card is not offered', () => {
    const g = game([V13.sai, V13.marco, V13.hajrudin, EV1]);
    useAbility(g, stage(g));
    // The pick is asked even though nothing qualifies: whether it appears must not reveal the deck.
    expect(kind(g)).toBe('choose');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(EV1);
  });

  it('with no Event in the top 3 nothing is added and the cards still go to the bottom', () => {
    const g = game([V13.sai, V13.marco, V13.hajrudin]);
    useAbility(g, stage(g));
    expect(kind(g)).toBe('choose');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 3)).toEqual([V13.sai, V13.marco, V13.hajrudin].sort());
    expect(deck(g)).toHaveLength(8);
  });

  it('with a Leader that is not [Sanji] the cost is still paid and nothing is looked at', () => {
    const g = game([EV1, EV2, V13.marco], LW.luffy);
    const before = deck(g);
    expect(offeredAbilities(g, stage(g))).toHaveLength(1);
    useAbility(g, stage(g));
    expect(atMain(g), snap(g)).toBe(true);
    expect(g.zone('p1', 'stage')).toHaveLength(0);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toEqual([...before, BARATIE]);
    expect(hasEvent(g, 'CardRevealed')).toBe(false);
  });

  it('works on the turn it is played: play it from hand (cost 1), then activate', () => {
    const g = mine(SANJI, { hand: [BARATIE], deck: [EV1, V13.sai, V13.marco, FILL, FILL] });
    playRaw(g, BARATIE);
    expect(atMain(g)).toBe(true);
    useAbility(g, stage(g));
    need(g, 'choose', 'p1');
    pickCards(g, [EV1]);
    settleOrders(g);
    expect(hand(g)).toEqual([EV1]);
  });

  it("[Activate: Main] is not offered on the opponent's turn", () => {
    const g = theirs(SANJI, { stage: BARATIE });
    expect(g.decider).toBe('p2');
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
  });

  it('[Trigger] Play this card: from Life it is played as my Stage, replacing a Stage I already have', () => {
    const g = theirs(
      SANJI,
      { life: [BARATIE, FILL, FILL], stage: 'OP05-021' },
      { characters: [V13.hajrudin] },
    );
    attack(g, at(g, 'p2', 'characters', V13.hajrudin), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    expect(sorted(g, 'p1', 'stage')).toEqual([BARATIE]);
    expect(trash(g)).toEqual(['OP05-021']);
    expect(g.life('p1')).toBe(2);
  });
});
