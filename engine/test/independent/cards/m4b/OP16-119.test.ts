/**
 * OP16-119 Marshall.D.Teach (Character, Yellow, cost 8, 10000, no Counter, {Blackbeard Pirates}/{The Seven
 * Warlords of the Sea}).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck; add up to 1 card to the top of your
 * Life cards. Then, place the rest at the bottom of your deck in any order.
 * [Trigger] Negate the effect of up to 1 of your opponent's Characters during this turn. Then, K.O.
 * up to 1 of your opponent's Characters with a cost of 5 or less."
 *
 * Rules: CR 8-4-4-1 ("up to" allows 0), CR 8-2 (negation), CR 10-1-5 ([Trigger]: the card is trashed
 * after resolving unless the effect plays it), CR 3-1-7 (the owner orders the bottom cards).
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  cardOf,
  choiceCards,
  choices,
  choose,
  chooseNone,
  chars,
  checkLook,
  deck,
  declineTrigger,
  hitLeader,
  kind,
  lifeCards,
  mine,
  playCard,
  reachablePickSets,
  RED,
  settleYes,
  SC,
  tail,
  theirs,
  trash,
  VAN,
  YL,
} from './kit-a.ts';

const TOP3 = [SC.bobbin, SC.genbo, SC.opera];

function onPlay() {
  const g = mine(YL.teach, {
    hand: ['OP16-119'],
    life: fill(RED, 3),
    deck: [...TOP3, ...fill(BLUE, 10)],
  });
  playCard(g, 'OP16-119');
  return g;
}

describe('OP16-119 Marshall.D.Teach: [On Play] look at 3, add up to 1 to the top of Life', () => {
  it('any of the 3 may be added (no filter): it becomes the top Life card, the other two go to the bottom', () => {
    const g = onPlay();
    checkLook(g, { candidates: [...TOP3], pick: [SC.genbo] });
    expect(g.life('p1')).toBe(4);
    expect(lifeCards(g)[0]).toBe(SC.genbo);
    expect(deck(g)).toHaveLength(12);
    expect(tail(deck(g), 2)).toEqual([SC.bobbin, SC.opera].sort());
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('CR 8-4-4-1: may add none; all three go to the bottom and Life is unchanged', () => {
    const g = onPlay();
    checkLook(g, { candidates: [...TOP3], pick: [] });
    expect(g.life('p1')).toBe(3);
    expect(deck(g)).toHaveLength(13);
    expect(tail(deck(g), 3)).toEqual([...TOP3].sort());
  });

  it('adds at most 1 card', () => {
    const sets = reachablePickSets(onPlay());
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    expect(sets.has('')).toBe(true);
  });

  it('the added card is not in hand and is face-down', () => {
    const g = onPlay();
    checkLook(g, { candidates: [...TOP3], pick: [SC.opera] });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });
});

describe('OP16-119 Marshall.D.Teach: [Trigger] negate up to 1, then K.O. up to 1 with cost 5 or less', () => {
  function triggered() {
    const g = theirs(
      YL.teach,
      { life: ['OP16-119', ...fill(BLUE, 3)] },
      { characters: [VAN.thatch, VAN.kingdew, VAN.marco] },
    );
    hitLeader(g);
    return g;
  }

  it('activating: negation may target any cost, the K.O. only cost 5 or less', () => {
    const g = triggered();
    activateTrigger(g);
    expect(kind(g)).toBe('choose');
    // First selection: the negation (any Character).
    expect(choiceCards(g).sort()).toEqual([VAN.thatch, VAN.kingdew, VAN.marco].sort());
    const thatch = choices(g).find((i) => cardOf(g, i) === VAN.thatch)!;
    choose(g, [thatch]);
    expect(g.card(thatch).negated).toBe(true);
    // Second selection: K.O. cost 5 or less (Thatch costs 6).
    expect(choiceCards(g).sort()).toEqual([VAN.kingdew, VAN.marco].sort());
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.kingdew)!]);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([VAN.thatch, VAN.marco].sort());
    expect(trash(g, 'p2')).toEqual([VAN.kingdew]);
    // The Trigger card is trashed afterwards; the hit removed one Life card.
    expect(trash(g, 'p1')).toEqual(['OP16-119']);
    expect(g.life('p1')).toBe(3);
  });

  it('the negated Character stays negated for the turn but not afterwards', () => {
    const g = triggered();
    activateTrigger(g);
    const marco = choices(g).find((i) => cardOf(g, i) === VAN.marco)!;
    choose(g, [marco]);
    chooseNone(g);
    expect(g.card(marco).negated).toBe(true);
    settleYes(g, 'p1');
    endTurn(g);
    expect(g.card(marco).negated).toBeFalsy();
  });

  it('both selections are "up to": declining both changes nothing', () => {
    const g = triggered();
    activateTrigger(g);
    chooseNone(g);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(3);
    for (const c of g.zone('p2', 'characters')) expect(c.negated).toBeFalsy();
  });

  it('the same Character may be negated and then K.O.’d', () => {
    const g = triggered();
    activateTrigger(g);
    const marco = choices(g).find((i) => cardOf(g, i) === VAN.marco)!;
    choose(g, [marco]);
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.marco)!]);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([VAN.kingdew, VAN.thatch].sort());
  });

  it('declining the [Trigger] adds the card to hand and nothing else happens', () => {
    const g = triggered();
    declineTrigger(g);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain('OP16-119');
    expect(chars(g, 'p2')).toHaveLength(3);
  });
});
