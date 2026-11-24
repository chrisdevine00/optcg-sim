/**
 * OP17-012 Blenheim (Character, Red, cost 2, 1000, Counter +1000, {Whitebeard Pirates}, Slash,
 * [Blocker]).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the new
 * target of the attack.)
 * [On K.O.] Play up to 1 card with a cost of 1 and a type including "Whitebeard Pirates" from your
 * hand."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 10-2-17 ([On K.O.] activates when the card is K.O.'d, by battle or
 * by an effect), CR 3-7-6-1 (rule trashing is not a K.O.), "a type including", CR 8-4-4-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import { blockers, fill } from '../../helpers.ts';
import {
  attack,
  blockWith,
  BLUE,
  chooseIfAsked,
  useCounter,
  charsOf,
  choiceCards,
  choose,
  chooseNone,
  decider,
  expectMain,
  hand,
  kind,
  LD,
  mine,
  offeredCard,
  opponentKOs,
  playCard,
  reachablePickSets,
  RED,
  settleYes,
  theirs,
  trash,
  VAN,
  WB,
} from './kit-op17a.ts';

const BLENHEIM = 'OP17-012';
/** cost-1 candidates: Doma (WB Allies, 3000), a Whitebeard Pirates-including type. */
const ONE = WB.doma;

/** p2 attacks p1's Leader; p1 blocks with Blenheim; no counter. Stops at the decision the K.O. causes. */
function blockedAndKOd(inHand: string[], extra: string[] = []) {
  const g = theirs(
    LD.luffy,
    { hand: inHand, characters: [BLENHEIM, ...extra], life: fill(BLUE, 4) },
    { characters: [WB.kingdew] },
  );
  attack(g, g.find('p2', 'characters', WB.kingdew), g.leader('p1'));
  blockWith(g, g.find('p1', 'characters', BLENHEIM));
  g.act({ type: 'endCounter' });
  return g;
}

describe('OP17-012 Blenheim: [Blocker]', () => {
  it('can block: it is offered as a blocker against an attack on my Leader', () => {
    const g = theirs(LD.luffy, { characters: [BLENHEIM] }, { characters: [WB.kingdew] });
    attack(g, g.find('p2', 'characters', WB.kingdew), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', BLENHEIM)]);
  });
});

describe('OP17-012 Blenheim: [On K.O.] play up to 1 cost-1 Whitebeard Pirates card from hand', () => {
  it('K.O.’d in battle while blocking: the cost-1 Whitebeard Pirates card is offered and played for free', () => {
    const g = blockedAndKOd([ONE]);
    expect(decider(g)).toBe('p1');
    expect(kind(g)).toBe('choose');
    choose(g, [offeredCard(g, ONE)]);
    expect(charsOf(g, 'p1')).toEqual([ONE]);
    expect(trash(g)).toEqual([BLENHEIM]);
    expect(hand(g)).toEqual([]);
  });

  it('only cost 1 AND a Whitebeard Pirates type: cost 2 (Decalvan), a non-Whitebeard cost-1 card (Mohji) and a cost-3 are not offered', () => {
    const g = blockedAndKOd([ONE, WB.decalvan, VAN.mohji, WB.formerMarco]);
    expect(choiceCards(g).sort()).toEqual([ONE].sort());
  });

  it('"a type including": {Whitebeard Pirates Allies} qualifies (Doma, cost 1); other WB cost-1 cards in hand also appear', () => {
    const g = blockedAndKOd([ONE, WB.doma]);
    expect(choiceCards(g)).toEqual([ONE, ONE]);
  });

  it('K.O.’d by an opponent’s effect (not in battle): the [On K.O.] works the same', () => {
    const g = theirs(
      LD.luffy,
      { hand: [ONE], characters: [BLENHEIM], life: fill(BLUE, 4) },
      { hand: ['OP09-077'] },
    );
    opponentKOs(g, g.find('p1', 'characters', BLENHEIM));
    expect(kind(g)).toBe('choose');
    expect(decider(g)).toBe('p1');
    choose(g, [offeredCard(g, ONE)]);
    expect(charsOf(g, 'p1')).toEqual([ONE]);
  });

  it('CR 8-4-4-1 "up to 1": the player may play nothing; the card stays in hand', () => {
    const g = blockedAndKOd([ONE]);
    chooseNone(g);
    expect(charsOf(g, 'p1')).toEqual([]);
    expect(hand(g)).toEqual([ONE]);
  });

  it('at most one card is played even with two candidates', () => {
    const g = blockedAndKOd([ONE, ONE]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    choose(g, [offeredCard(g, ONE)]);
    settleYes(g, 'p1');
    expect(charsOf(g, 'p1')).toEqual([ONE]);
    expect(hand(g)).toEqual([ONE]);
  });

  it('with no eligible card in hand nothing is asked', () => {
    const g = blockedAndKOd([VAN.mohji, WB.thatch]);
    settleYes(g, 'p1');
    expect(decider(g)).toBe('p2');
    expect(kind(g)).toBe('main');
    expect(charsOf(g, 'p1')).toEqual([]);
  });

  it('CR 3-7-6-1: trashed by the 6th-Character rule it is not K.O.’d: no [On K.O.]', () => {
    const g = mine(LD.luffy, {
      hand: [WB.jil, ONE],
      characters: [BLENHEIM, WB.kingdew, WB.thatch, WB.namule, WB.decalvan],
    });
    playCard(g, WB.jil);
    choose(g, [g.find('p1', 'characters', BLENHEIM)]);
    expectMain(g);
    expect(charsOf(g, 'p1')).toContain(WB.jil);
    expect(trash(g)).toEqual([BLENHEIM]);
    expect(hand(g)).toEqual([ONE]);
  });

  it('surviving the battle does not trigger it: an OP05-114 El Thor (+4000 with the opponent at 2 Life) Counter-boosted Blenheim beats the attacker and nothing is asked', () => {
    const g = theirs(
      LD.luffy,
      {
        hand: [ONE, 'OP05-114'],
        characters: [BLENHEIM],
        life: fill(BLUE, 4),
        costArea: { active: 1, rested: 0 },
      },
      { characters: [WB.doma], life: fill(RED, 2) },
    );
    attack(g, g.find('p2', 'characters', WB.doma), g.leader('p1'));
    const blenheim = g.find('p1', 'characters', BLENHEIM);
    blockWith(g, blenheim);
    expect(kind(g)).toBe('counter');
    useCounter(g, g.find('p1', 'hand', 'OP05-114'), blenheim);
    chooseIfAsked(g, [blenheim]);
    g.act({ type: 'endCounter' });
    expectMain(g, 'p2');
    expect(charsOf(g, 'p1')).toEqual([BLENHEIM]);
    expect(hand(g)).toEqual([ONE]);
  });
});
