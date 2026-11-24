/**
 * EB04-034 Charlotte Pudding (Character, Purple, cost 2, 1000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[Blocker]
 * [On Your Opponent's Attack] [Once Per Turn] You may trash 1 card from your hand: If you have 4 or
 * more Events in your trash, up to 1 of your Leader or Character cards gains +2000 power during this
 * battle."
 *
 * Rules: "On Your Opponent's Attack" triggers when the opponent declares an attack (CR 10-2-14),
 * whatever the target. The cost is paid before the "If" is checked. "Once per turn" counts each
 * turn. Power gained "during this battle" ends with the battle. An attack succeeds when the
 * attacker's power is equal to or greater than the defender's.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  blockers,
  chars,
  EVT,
  fill,
  hand,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  payCard,
  pickRaw,
  theirs,
  trash,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-034';
const SAI = 'OP01-012'; // Red, cost 2, 4000, vanilla
const HAJ = 'OP01-018'; // Red, cost 4, 6000, vanilla
const KINGDEW = 'OP02-006'; // Red, cost 5, 7000, vanilla
/** An Event card and a Character card for the trash. */
const FOUR_EVENTS = [EVT, EVT, EVT, EVT];

function defending(opts: {
  trash?: string[];
  hand?: string[];
  mine?: (string | { card: string; rested: boolean })[];
  foes?: string[];
}): TestGame {
  return theirs(
    LB.foxy,
    {
      characters: opts.mine ?? [ID],
      hand: opts.hand ?? [BLUE, BLUE],
      trash: opts.trash ?? FOUR_EVENTS,
      deck: fill(BLUE, 10),
      life: fill(BLUE, 4),
    },
    { characters: opts.foes ?? [HAJ] },
  );
}

/** p2's first Character attacks p1's Leader. */
function swingAtLeader(g: TestGame): void {
  attack(g, g.find('p2', 'characters', HAJ, 0), g.leader('p1'));
}

/** Finish the battle without defending; leave any damage decisions answered. */
function finishBattle(g: TestGame): void {
  if (kind(g) === 'block') passBlock(g);
  if (kind(g) === 'counter') g.act({ type: 'endCounter' });
  while (kind(g) === 'trigger') g.act({ type: 'trigger', activate: false });
}

describe("EB04-034 Charlotte Pudding: [On Your Opponent's Attack] trash 1, with 4+ Events in trash +2000", () => {
  it('with 4 Events in the trash the Leader gets +2000 and survives a 6000 attack', () => {
    const g = defending({});
    swingAtLeader(g);
    need(g, 'optional', 'p1');
    g.act({ type: 'optional', accept: true });
    payCard(g, BLUE);
    pickRaw(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(7000);
    finishBattle(g);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([BLUE]);
    expect(trash(g)).toHaveLength(5);
  });

  it('the same attack without the boost takes a Life card', () => {
    const g = defending({});
    swingAtLeader(g);
    need(g, 'optional', 'p1');
    g.act({ type: 'optional', accept: false });
    expect(g.power(g.leader('p1'))).toBe(5000);
    finishBattle(g);
    expect(g.life('p1')).toBe(3);
    // the two cards in hand are untouched; the damaged Life card was added to the hand
    expect(hand(g)).toEqual([BLUE, BLUE, BLUE]);
  });

  it('boundary: with only 3 Events in the trash nobody gets the power', () => {
    const g = defending({ trash: [EVT, EVT, EVT] });
    swingAtLeader(g);
    if (kind(g) === 'optional') {
      g.act({ type: 'optional', accept: true });
      payCard(g, BLUE);
    }
    expect(kind(g)).not.toBe('choose');
    expect(g.power(g.leader('p1'))).toBe(5000);
    finishBattle(g);
    expect(g.life('p1')).toBe(3);
  });

  it('Character cards in the trash are not Events: 3 Events and a Character do not count', () => {
    const g = defending({ trash: [EVT, EVT, EVT, SAI] });
    swingAtLeader(g);
    if (kind(g) === 'optional') {
      g.act({ type: 'optional', accept: true });
      payCard(g, BLUE);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    finishBattle(g);
    expect(g.life('p1')).toBe(3);
  });

  it('the targets offered are the Leader and the Characters of the controller only', () => {
    const g = defending({ mine: [ID, SAI] });
    swingAtLeader(g);
    g.act({ type: 'optional', accept: true });
    payCard(g, BLUE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ID, LB.foxy, SAI].sort());
  });

  it('"up to 1": may choose nobody after paying', () => {
    const g = defending({});
    swingAtLeader(g);
    g.act({ type: 'optional', accept: true });
    payCard(g, BLUE);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Character can be the one boosted (power +2000 on the Character)', () => {
    const g = defending({ mine: [ID, SAI] });
    swingAtLeader(g);
    g.act({ type: 'optional', accept: true });
    payCard(g, BLUE);
    pickRaw(g, g.find('p1', 'characters', SAI));
    expect(g.power(g.find('p1', 'characters', SAI))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the +2000 lasts only for the battle', () => {
    const g = defending({});
    swingAtLeader(g);
    g.act({ type: 'optional', accept: true });
    payCard(g, BLUE);
    pickRaw(g, g.leader('p1'));
    finishBattle(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: a second attack in the same turn is not offered the effect again', () => {
    const g = defending({ foes: [HAJ, HAJ] });
    swingAtLeader(g);
    g.act({ type: 'optional', accept: true });
    payCard(g, BLUE);
    pickRaw(g, g.leader('p1'));
    finishBattle(g);
    expect(g.life('p1')).toBe(4);
    attack(g, g.find('p2', 'characters', HAJ, 1), g.leader('p1'));
    expect(kind(g)).toBe('block');
  });

  it('it also triggers when the opponent attacks one of your Characters', () => {
    const g = defending({ mine: [ID, { card: SAI, rested: true }] });
    attack(g, g.find('p2', 'characters', HAJ), g.find('p1', 'characters', SAI));
    need(g, 'optional', 'p1');
  });

  it('with no card in hand the cost cannot be paid and no power is gained', () => {
    const g = defending({ hand: [] });
    swingAtLeader(g);
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      g.act({ type: 'optional', accept: false });
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    finishBattle(g);
    expect(g.life('p1')).toBe(3);
  });

  it('does not trigger on your own attack', () => {
    const g = mine(LB.foxy, { characters: [ID, KINGDEW], hand: [BLUE], trash: FOUR_EVENTS }, {});
    attack(g, g.find('p1', 'characters', KINGDEW), g.leader('p2'));
    need(g, 'block', 'p2');
    expect(chars(g)).toContain(ID);
  });

  it('[Blocker]: Pudding is a legal blocker for an attack on the Leader', () => {
    const g = defending({ trash: [] });
    swingAtLeader(g);
    if (kind(g) === 'optional') g.act({ type: 'optional', accept: false });
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });
});
