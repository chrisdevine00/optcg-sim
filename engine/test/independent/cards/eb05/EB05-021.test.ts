/**
 * EB05-021 Alvida (Character, Blue, cost 9, 7000, Counter +1000, {Cross Guild}, Strike).
 *
 * Card text: "[On Play] Draw 2 cards and play up to 1 {Cross Guild} type Character card with a cost of
 * 8 or less from your hand. Then, you cannot play Character cards during this turn.
 * [When Attacking] Negate the effect of up to 1 of your opponent's Characters during this turn."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 4-10-2 ("Then" still resolves), CR 8-2 (negation), RL-09
 * ("during this turn"), CR 10-1-4 ([Blocker] is an effect that negation removes).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, endTurn, fill } from '../../helpers.ts';
import {
  activate,
  BLUE,
  canActivate,
  chars,
  choiceCards,
  choices,
  choose,
  chooseNone,
  deck,
  EC,
  EL,
  AKP,
  hand,
  inHand,
  kind,
  mine,
  offeredInstance,
  playCard,
  reachablePickSets,
  settleYes,
  VAN,
} from './kit-eb05a.ts';

const ALVIDA = 'EB05-021';
/** OP12-049 Buggy: Blue, cost 6, 7000, {The Four Emperors}/{Cross Guild}, vanilla. */
const BUGGY = 'OP12-049';
/** OP09-055 Mr.1(Daz.Bonez): Blue, cost 5, 7000, {Former Baroque Works}/{Cross Guild}, vanilla. */
const MR1 = 'OP09-055';

function played(inHandCards: string[], top: string[] = []) {
  const g = mine(EL.croc, { hand: [ALVIDA, ...inHandCards], deck: [...top, ...fill(BLUE, 12)] });
  playCard(g, ALVIDA);
  return g;
}
const canPlay = (g: ReturnType<typeof played>, card: string) =>
  g.legal().some((a) => a.type === 'playCard' && a.card === inHand(g, card));

describe('EB05-021 Alvida: [On Play] draw 2, play up to 1 {Cross Guild} Character with cost 8 or less, then no more Character plays', () => {
  it('draws 2 and plays the chosen {Cross Guild} Character (cost 6) for free', () => {
    const g = played([BUGGY, MR1]);
    expect(choiceCards(g)).toEqual([BUGGY, MR1].sort());
    choose(g, [offeredInstance(g, BUGGY)]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([ALVIDA, BUGGY].sort());
    expect(hand(g)).toEqual([BLUE, BLUE, MR1].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('cost boundary: a {Cross Guild} Character with cost 9 (another Alvida) is not a candidate', () => {
    const g = played([ALVIDA, MR1]);
    expect(choiceCards(g)).toEqual([MR1]);
  });

  it('only {Cross Guild} cards: a Character of another type is not a candidate', () => {
    const g = played([VAN.marco, MR1]);
    expect(choiceCards(g)).toEqual([MR1]);
  });

  it('a card drawn by this effect is a candidate', () => {
    const g = played([], [MR1, BLUE]);
    expect(choiceCards(g)).toEqual([MR1]);
  });

  it('"up to 1": may play nothing', () => {
    const g = played([BUGGY]);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([ALVIDA]);
    expect(hand(g)).toContain(BUGGY);
  });

  it('plays at most 1', () => {
    const g = played([BUGGY, MR1]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('"Then, you cannot play Character cards during this turn": no Character in hand is playable afterwards', () => {
    const g = played([BUGGY, VAN.sunny]);
    choose(g, [offeredInstance(g, BUGGY)]);
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(canPlay(g, VAN.sunny)).toBe(false);
  });

  it('the restriction applies even if no Character was played (the "Then" clause still resolves)', () => {
    const g = played([VAN.sunny]);
    settleYes(g, 'p1');
    expect(canPlay(g, VAN.sunny)).toBe(false);
  });

  it('Events can still be played (only Character cards are restricted)', () => {
    const g = played([AKP.mamaragan, VAN.sunny]);
    settleYes(g, 'p1');
    expect(canPlay(g, AKP.mamaragan)).toBe(true);
  });

  it('the restriction also stops Characters played by effects (OP02-010 Dogura cannot play one this turn)', () => {
    const g = mine(EL.croc, {
      hand: [ALVIDA, VAN.komachiyo],
      characters: ['OP02-010'],
      deck: fill(BLUE, 12),
    });
    playCard(g, ALVIDA);
    settleYes(g, 'p1');
    const dogura = g.find('p1', 'characters', 'OP02-010');
    if (canActivate(g, dogura)) {
      activate(g, dogura);
      settleYes(g, 'p1');
    }
    expect(chars(g)).toEqual([ALVIDA, 'OP02-010'].sort());
    expect(hand(g)).toContain(VAN.komachiyo);
  });

  it('the restriction ends with the turn: Characters can be played next turn', () => {
    const g = played([VAN.sunny]);
    settleYes(g, 'p1');
    endTurn(g);
    endTurn(g);
    expect(canPlay(g, VAN.sunny)).toBe(true);
  });
});

describe('EB05-021 Alvida: [When Attacking] negate the effect of up to 1 opposing Character during this turn', () => {
  /** Gloriosa (data keyword [Blocker]) is the observable effect on the opposing side. */
  function attacking(opp: string[] = [EC.blockerWisdom, VAN.marco]) {
    const g = mine(EL.croc, { characters: [ALVIDA, EC.sengoku] }, { characters: opp });
    attack(g, g.find('p1', 'characters', ALVIDA), g.leader('p2'));
    return g;
  }
  const negated = (g: ReturnType<typeof attacking>, card: string) =>
    !!g.card(g.find('p2', 'characters', card)).negated;

  it('negates the chosen opposing Character: its [Blocker] no longer works', () => {
    const g = attacking();
    expect(kind(g)).toBe('choose');
    choose(g, [offeredInstance(g, EC.blockerWisdom)]);
    settleYes(g, 'p2');
    expect(negated(g, EC.blockerWisdom)).toBe(true);
    expect(negated(g, VAN.marco)).toBe(false);
    expect(blockers(g)).toEqual([]);
  });

  it('only the opponent’s Characters are candidates (not my Characters, not Leaders)', () => {
    const g = attacking();
    expect(choices(g).every((i) => g.card(i).owner === 'p2')).toBe(true);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('"up to 1": may negate nobody (the Blocker then stays active)', () => {
    const g = attacking();
    chooseNone(g);
    expect(negated(g, EC.blockerWisdom)).toBe(false);
    expect(blockers(g)).toHaveLength(1);
  });

  it('negates at most 1', () => {
    const g = attacking([EC.blockerWisdom, VAN.marco]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('"during this turn": the negation ends with the turn', () => {
    const g = attacking();
    choose(g, [offeredInstance(g, EC.blockerWisdom)]);
    settleYes(g, 'p2');
    expect(negated(g, EC.blockerWisdom)).toBe(true);
    // finish the battle: p2 neither blocks nor counters
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    while (kind(g) === 'trigger') g.act({ type: 'trigger', activate: false });
    endTurn(g);
    expect(negated(g, EC.blockerWisdom)).toBe(false);
  });

  it('does not happen when a different Character attacks (it is Alvida’s [When Attacking])', () => {
    const g = mine(
      EL.croc,
      { characters: [ALVIDA, EC.sengoku] },
      { characters: [EC.blockerWisdom] },
    );
    attack(g, g.find('p1', 'characters', EC.sengoku), g.leader('p2'));
    expect(kind(g)).toBe('block');
    expect(negated(g, EC.blockerWisdom)).toBe(false);
  });
});
