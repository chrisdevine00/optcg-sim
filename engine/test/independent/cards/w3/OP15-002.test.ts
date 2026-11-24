/**
 * OP15-002 Lucy (Leader, Blue/Red, 5000, 4 Life, {Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "[When Attacking]/[On Your Opponent's Attack] You may trash any number of Event or
 * Stage cards from your hand. This Leader gains +1000 power during this battle for every card
 * trashed. [Activate: Main] [Once Per Turn] If you have activated an Event with a base cost of 3 or
 * more during this turn, draw 1 card."
 *
 * Rules: "any number" includes 0 (CR 8-4-4-1); only Events and Stages qualify; the boost is +1000
 * per card and lasts for the battle (CR 7-1-3); "activated an Event" means played from hand and
 * resolved its [Main] or [Counter] (an Event trashed from hand, or a [Trigger] activation, is not
 * "activating an Event", QA-OP15 OP15-002); the base (printed) cost counts; [Once Per Turn]
 * CR 10-2-13. Open readings (M6b-Q27/Q28, an Event activated by another effect) are not tested.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  choices,
  deck,
  hand,
  kind,
  mine,
  n,
  need,
  offeredIds,
  offeredNow,
  passBlock,
  passCounter,
  pickInst,
  theirs,
  toMyNextMain,
  trash,
  useAbility,
  W3C,
  none,
} from './kit-w3.ts';

const LUCY = 'OP15-002';
/** OP05-117 Upper Yard: Yellow Stage, cost 1. */
const STAGE = 'OP05-117';
/** OP15-019 Barrier Bulls: Red Event, base cost 3. [Main] draw 1 card and the Leader gains +1000 power. */
const EV3 = 'OP15-019';
/** OP16-101 Mahoroba: Black Event, base cost 2. [Main] up to 1 Leader or Character gains +3000. */
const EV2 = 'OP16-101';
/** OP15-020 Fire Fist: Red Event, base cost 7. */
const EV7 = 'OP15-020';
const EV0 = W3C.bounce;

describe('OP15-002 Lucy: [When Attacking] trash any number of Event or Stage cards: +1000 power for every card', () => {
  const attacking = (inHand: string[], p2: Parameters<typeof mine>[2] = {}) => {
    const g = mine(LUCY, { hand: inHand }, p2);
    attack(g, g.leader('p1'), g.leader('p2'));
    return g;
  };

  it('trashing 2 cards gives the Leader +2000 power during this battle', () => {
    const g = attacking([EV0, STAGE, W3C.sai]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'hand', EV0), g.find('p1', 'hand', STAGE)]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(trash(g)).toEqual([EV0, STAGE].sort());
    expect(hand(g)).toEqual([W3C.sai]);
  });

  it('only Event and Stage cards are offered: a Character in hand is not', () => {
    const g = attacking([EV0, STAGE, W3C.sai]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EV0, STAGE].sort());
  });

  it('"any number": choosing none trashes nothing and gives no boost', () => {
    const g = attacking([EV0, STAGE]);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([EV0, STAGE].sort());
    need(g, 'block', 'p2');
  });

  it('+1000 for every card: 1 card is +1000 and 3 cards are +3000', () => {
    const one = attacking([EV0, STAGE]);
    pickInst(one, [one.find('p1', 'hand', EV0)]);
    expect(one.power(one.leader('p1'))).toBe(6000);
    const three = attacking([EV0, STAGE, EV2]);
    pickInst(three, [
      three.find('p1', 'hand', EV0),
      three.find('p1', 'hand', STAGE),
      three.find('p1', 'hand', EV2),
    ]);
    expect(three.power(three.leader('p1'))).toBe(8000);
  });

  it('the boost can decide the battle: 8000 K.O.s a rested 8000 Character that 5000 could not', () => {
    const aim = (trashed: number) => {
      const g = mine(
        LUCY,
        { hand: [EV0, STAGE, EV2] },
        { characters: [{ card: W3C.thatch, rested: true }] },
      );
      attack(g, g.leader('p1'), g.find('p2', 'characters', W3C.thatch));
      const cards = [EV0, STAGE, EV2].slice(0, trashed).map((c) => g.find('p1', 'hand', c));
      if (cards.length) pickInst(g, cards);
      else none(g);
      passBlock(g);
      passCounter(g);
      return g;
    };
    expect(aim(3).zone('p2', 'characters')).toHaveLength(0);
    expect(aim(2).zone('p2', 'characters')).toHaveLength(1);
    expect(aim(0).zone('p2', 'characters')).toHaveLength(1);
  });

  it('the boost ends with the battle', () => {
    const g = attacking([EV0]);
    pickInst(g, [g.find('p1', 'hand', EV0)]);
    passBlock(g);
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p2')).toBe(3);
  });

  it('it is optional text only in effect: with no Event or Stage in hand nothing is trashed', () => {
    const g = mine(LUCY, { hand: [W3C.sai] }, {});
    attack(g, g.leader('p1'), g.leader('p2'));
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    need(g, 'block', 'p2');
    expect(hand(g)).toEqual([W3C.sai]);
  });
});

describe("OP15-002 Lucy: [On Your Opponent's Attack] the same trash and boost on defence", () => {
  const defending = (target: 'leader' | 'sai', inHand: string[]) => {
    const g = theirs(
      LUCY,
      { hand: inHand, characters: [{ card: W3C.sai, rested: true }] },
      { characters: [W3C.thatch] },
    );
    if (target === 'leader') attack(g, g.leader('p2'), g.leader('p1'));
    else attack(g, g.find('p2', 'characters', W3C.thatch), g.find('p1', 'characters', W3C.sai));
    return g;
  };

  it('trashing 1 Event on an attack against my Leader gives +1000 and 5000 no longer connects', () => {
    const g = defending('leader', [EV0, W3C.sai]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'hand', EV0)]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(trash(g)).toEqual([EV0]);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('without the trash the same attack connects', () => {
    const g = defending('leader', [EV0]);
    none(g);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('it also triggers when the attack is aimed at one of my Characters', () => {
    const g = defending('sai', [EV0]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EV0]);
  });

  it('the boost ends after the battle', () => {
    const g = defending('leader', [EV0]);
    pickInst(g, [g.find('p1', 'hand', EV0)]);
    passBlock(g);
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describe('OP15-002 Lucy: [Activate: Main] [Once Per Turn] draw 1 if I activated an Event with base cost 3 or more this turn', () => {
  const start = (inHand: string[]) => mine(LUCY, { hand: inHand });
  const playEvent = (g: ReturnType<typeof start>, card: string) => {
    act(g, { type: 'playCard', card: g.find('p1', 'hand', card) });
    // Answer whatever the Event asks (a target) by taking the first pick, then finish.
    for (let i = 0; i < 5 && kind(g) === 'choose'; i++) {
      const p = g.legal().find((a) => a.type === 'pick');
      if (p) g.act(p);
      else act(g, { type: 'done' });
    }
    expect(atMain(g)).toBe(true);
  };

  it('after activating a cost-3 Event: the ability draws exactly 1 card', () => {
    const g = start([EV3]);
    playEvent(g, EV3);
    const before = deck(g).length;
    useAbility(g, g.leader('p1'));
    expect(deck(g)).toHaveLength(before - 1);
  });

  it('a cost 7 Event (3 or more) counts too', () => {
    const g = start([EV7]);
    playEvent(g, EV7);
    const before = deck(g).length;
    useAbility(g, g.leader('p1'));
    expect(deck(g)).toHaveLength(before - 1);
  });

  it('boundary: a base cost 2 Event does not count', () => {
    const g = start([EV2]);
    playEvent(g, EV2);
    const before = deck(g).length;
    if (offeredNow(g, g.leader('p1'))) useAbility(g, g.leader('p1'));
    expect(deck(g)).toHaveLength(before);
  });

  it('no Event activated this turn: nothing is drawn', () => {
    const g = start([EV3]);
    const before = deck(g).length;
    if (offeredNow(g, g.leader('p1'))) useAbility(g, g.leader('p1'));
    expect(deck(g)).toHaveLength(before);
    expect(hand(g)).toEqual([EV3]);
  });

  it('a Character with cost 3 or more is not an Event: nothing is drawn', () => {
    const g = start([W3C.marco]);
    act(g, { type: 'playCard', card: g.find('p1', 'hand', W3C.marco) });
    const before = deck(g).length;
    if (offeredNow(g, g.leader('p1'))) useAbility(g, g.leader('p1'));
    expect(deck(g)).toHaveLength(before);
  });

  it('an Event trashed from hand to Lucy\'s own [When Attacking] is not "activated"', () => {
    const g = start([EV3]);
    attack(g, g.leader('p1'), g.leader('p2'));
    pickInst(g, [g.find('p1', 'hand', EV3)]);
    passBlock(g);
    passCounter(g);
    const before = deck(g).length;
    if (offeredNow(g, g.leader('p1'))) useAbility(g, g.leader('p1'));
    expect(deck(g)).toHaveLength(before);
  });

  it('[Once Per Turn]: used once it is not offered again, even after another cost-3 Event', () => {
    const g = start([EV3, EV3]);
    playEvent(g, EV3);
    useAbility(g, g.leader('p1'));
    playEvent(g, EV3);
    expect(offeredNow(g, g.leader('p1'))).toBe(false);
  });

  it('an Event activated on an earlier turn does not count: next turn nothing is drawn', () => {
    const g = start([EV3]);
    playEvent(g, EV3);
    toMyNextMain(g);
    const before = deck(g).length;
    if (offeredNow(g, g.leader('p1'))) useAbility(g, g.leader('p1'));
    // The draw of this turn's Draw Phase is already in `before`.
    expect(deck(g)).toHaveLength(before);
    void n;
  });
});
