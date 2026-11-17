/**
 * OP08-115 The Earth Will Not Lose! (Event, Yellow, cost 1, {Sky Island}/{Shandian Warrior}).
 *
 * Card text: "[Counter] If your Leader has the {Shandian Warrior} type, up to 1 of your Leader or Character
 * cards gains +3000 power during this battle. Then, play up to 1 [Upper Yard] from your hand.
 * [Trigger] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 8-3-3 (a failed "if" resolves nothing), CR 8-4-4-1 ("up to" allows 0), RL-08 ("during this
 * battle" ends with the battle), CR 10-1-5 ([Trigger]).
 * Reading of "If ..., A. Then, B.": the digest says text after a failed "if" does not resolve (CR 8-3-3), so B is
 * skipped too. The text is two sentences, so this reading is open to doubt; it is the one the sibling cards
 * EB02-052 and OP09-078 are scripted with (see DISAGREEMENTS-a.md A-4).
 */
import { describe, expect, it } from 'vitest';
import { attack, fill, passBlock } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  canCounterWith,
  chooseIfAsked,
  chooseNone,
  decider,
  deck,
  hand,
  hitLeader,
  kind,
  RED,
  SC,
  settleNo,
  settleYes,
  skipUnusable,
  theirs,
  trash,
  useCounter,
  YL,
  choose,
  choices,
} from './kit-a.ts';
import { endTurn } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EVENT = 'OP08-115';
const UY = SC.upperYard;

/** p2's Leader (5000) attacks p1's Leader; p1 reaches the Counter Step with the Event in hand. */
function counterStep(leader: string, handExtra: string[] = [UY], characters: string[] = []) {
  const g = theirs(leader, {
    hand: [EVENT, ...handExtra],
    costArea: { active: 1, rested: 0 },
    characters,
    deck: fill(BLUE, 10),
  });
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  expect(kind(g)).toBe('counter');
  return g;
}

const stage = (g: TestGame) => g.zone('p1', 'stage').map((c) => c.card);

describe('OP08-115 The Earth Will Not Lose!: [Counter] +3000 if Shandian Warrior Leader, then play [Upper Yard]', () => {
  it('Shandian Warrior Leader: +3000 on the Leader holds the attack off; [Upper Yard] is played from hand', () => {
    const g = counterStep(YL.shandian);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    // The play step: choose [Upper Yard]; its own [On Play] is then declined.
    if (kind(g) === 'choose' && choices(g).some((i) => g.card(i).card === UY)) {
      choose(g, [g.find('p1', 'hand', UY)]);
    }
    settleNo(g, 'p1');
    expect(stage(g)).toEqual([UY]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([EVENT]);
    if (kind(g) === 'counter') g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('the +3000 can go on one of my Characters instead (up to 1 Leader or Character)', () => {
    const g = counterStep(YL.shandian, [], [SC.genbo]);
    const genbo = g.find('p1', 'characters', SC.genbo);
    useCounter(g, g.find('p1', 'hand', EVENT), genbo);
    chooseIfAsked(g, [genbo]);
    expect(g.power(genbo)).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may give the +3000 to nobody', () => {
    const g = counterStep(YL.shandian, []);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    if (kind(g) === 'choose') chooseNone(g);
    settleNo(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-3: a Leader without {Shandian Warrior} gets no +3000', () => {
    const g = counterStep(YL.sky, []);
    if (canCounterWith(g, g.find('p1', 'hand', EVENT))) {
      useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
      chooseIfAsked(g, [g.leader('p1')]);
      settleYes(g, 'p1');
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  // DISAGREEMENTS-a.md A-4 (fixed in M4b fix round 1): "Then" is gated by the failed "If".
  it('CR 8-3-3: a Leader without {Shandian Warrior}: the "Then, play [Upper Yard]" does not resolve either', () => {
    const g = counterStep(YL.sky, [UY]);
    if (canCounterWith(g, g.find('p1', 'hand', EVENT))) {
      useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
      chooseIfAsked(g, [g.leader('p1')]);
      settleYes(g, 'p1');
    }
    expect(stage(g)).toEqual([]);
    expect(hand(g)).toContain(UY);
  });

  it('no [Upper Yard] in hand: the +3000 still applies and nothing is played', () => {
    const g = counterStep(YL.shandian, [SC.bobbin]);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    skipUnusable(g, 'p1');
    if (kind(g) === 'choose') chooseNone(g);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(stage(g)).toEqual([]);
  });

  it('"up to 1" [Upper Yard]: may be left in hand', () => {
    const g = counterStep(YL.shandian);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    if (kind(g) === 'choose') chooseNone(g);
    settleNo(g, 'p1');
    expect(stage(g)).toEqual([]);
    expect(hand(g)).toEqual([UY]);
  });

  it('RL-08: the +3000 ends with the battle', () => {
    const g = counterStep(YL.shandian, []);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    settleNo(g, 'p1');
    if (kind(g) === 'counter') g.act({ type: 'endCounter' });
    expect(decider(g)).toBe('p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
    endTurn(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describe('OP08-115 The Earth Will Not Lose!: [Trigger] draw 2 and trash 1', () => {
  function hit() {
    const g = theirs(YL.shandian, {
      life: [EVENT, ...fill(RED, 3)],
      deck: [SC.bobbin, SC.opera, ...fill(BLUE, 10)],
    });
    hitLeader(g);
    return g;
  }

  it('activating draws 2, then p1 trashes 1 card from hand; the Event card itself is trashed too', () => {
    const g = hit();
    activateTrigger(g);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p1', 'hand', SC.bobbin)]);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([SC.opera]);
    expect(trash(g)).toEqual([EVENT, SC.bobbin].sort());
    expect(deck(g)).toHaveLength(10);
  });
});
