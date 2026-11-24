/**
 * OP14-018 Time for the Counterattack (Event, red, cost 1, {Heart Pirates}/{Supernovas}/{The Seven
 * Warlords of the Sea}).
 *
 * Card text: "[Counter] If there is a Character with 8000 power or more, up to 1 of your Leader or
 * Character cards gains +4000 power during this battle.
 * [Trigger] Play up to 1 red Character card with 2000 power or less from your hand."
 *
 * Rules: an Event [Counter] is used in the Counter Step by paying its cost. "If there
 * is a Character" looks at BOTH fields and at current power (given DON!! count on their owner's
 * turn, RL-13). "During this battle" ends with the battle (rulings duration table). A [Trigger]
 * (CR 10-1-5) is activated from the Life card instead of adding it to hand; the card is trashed
 * afterwards.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  attack,
  canCounterWith,
  chars,
  chr,
  chooseIfAsked,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  LD14,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  S14,
  skipEmpty,
  theirs,
  trash,
  useCounter,
  fill,
  BLUE,
  donOf,
} from './kit-op14a.ts';

const EVENT = 'OP14-018';

/** p2 attacks p1's Leader with their Character `atk`; p1 holds the Event, `active` DON!! available. */
function counterBoard(
  atk: string | { card: string; don?: number },
  opts: { mine?: string[]; p2extra?: string[]; hand?: string[]; active?: number } = {},
) {
  const atkId = typeof atk === 'string' ? atk : atk.card;
  const g = theirs(
    LD14.croc,
    {
      hand: [EVENT, ...(opts.hand ?? [])],
      costArea: { active: opts.active ?? 3, rested: 0 },
      characters: opts.mine ?? [],
    },
    {
      costArea: { active: 10 - (typeof atk === 'string' ? 0 : (atk.don ?? 0)), rested: 0 },
      characters: [atk, ...(opts.p2extra ?? [])],
    },
  );
  attack(g, at(g, 'p2', 'characters', atkId), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

describe('OP14-018 Time for the Counterattack: [Counter] +4000 if a Character has 8000 power or more', () => {
  it('printed values: Event, cost 1', () => {
    const g = counterBoard(S14.marco);
    const c = g.card(g.find('p1', 'hand', EVENT));
    expect(c.cost).toBe(1);
  });

  it("with an 8000-power Character on the opponent's side (the attacker) my Leader gets +4000 this battle", () => {
    const g = counterBoard(S14.thatch);
    expect(canCounterWith(g, g.find('p1', 'hand', EVENT))).toBe(true);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    g.act({ type: 'endCounter' });
    // Thatch (8000) does not beat 9000: no damage.
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('the 8000-power Character may be on MY side (any Character counts)', () => {
    const g = counterBoard(S14.marco, { mine: [S14.thatch] });
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: with only a 7000-power Character on the field there is no bonus and the Event is still spent', () => {
    const g = counterBoard(S14.kingdew);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    g.act({ type: 'endCounter' });
    // Kingdew (7000) beats the Leader (5000): one Life lost.
    while (kind(g) === 'trigger') g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(3);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('current power counts: a 5000 Character with 3 DON!! on its owner turn is 8000 and satisfies it', () => {
    const g = counterBoard({ card: S14.marco, don: 3 });
    expect(g.power(at(g, 'p2', 'characters', S14.marco))).toBe(8000);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('may give the +4000 to one of my Characters instead (the attacked one)', () => {
    const g = theirs(
      LD14.croc,
      {
        hand: [EVENT],
        costArea: { active: 3, rested: 0 },
        characters: [{ card: S14.sai, rested: true }],
      },
      { characters: [S14.thatch] },
    );
    attack(g, at(g, 'p2', 'characters', S14.thatch), chr(g, 'p1', S14.sai));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', EVENT), chr(g, 'p1', S14.sai));
    chooseIfAsked(g, [chr(g, 'p1', S14.sai)]);
    expect(g.power(chr(g, 'p1', S14.sai))).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": choosing no one gives no bonus', () => {
    const g = counterBoard(S14.thatch);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    if (kind(g) === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the +4000 ends with the battle', () => {
    const g = counterBoard(S14.thatch);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    g.act({ type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('an Event whose cost cannot be paid is not usable as a Counter (no active DON!!)', () => {
    const g = counterBoard(S14.thatch, { active: 0 });
    expect(canCounterWith(g, g.find('p1', 'hand', EVENT))).toBe(false);
  });
});

/** p2 hits my Leader; my top Life card is the Event with its [Trigger]. */
function triggered(hand: string[]) {
  const g = theirs(
    LD14.croc,
    {
      hand,
      life: [EVENT, ...fill(BLUE, 3)],
      costArea: { active: 0, rested: 0 },
    },
    { characters: [S14.marco] },
  );
  hitLeader(g, at(g, 'p2', 'characters', S14.marco));
  need(g, 'trigger', 'p1');
  return g;
}

describe('OP14-018 Time for the Counterattack: [Trigger] play a red Character with 2000 power or less', () => {
  it('offers exactly the red Characters with 2000 power or less in hand', () => {
    const g = triggered([S14.dadan, S14.komachiyo, S14.killer2, S14.cobra, 'ST01-014']);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.cobra, S14.dadan].sort());
  });

  it('plays the chosen Character for free and the Event goes to the trash', () => {
    const g = triggered([S14.dadan, S14.whitey]);
    activateTrigger(g);
    pickInst(g, [g.find('p1', 'hand', S14.dadan)]);
    expect(chars(g)).toEqual([S14.dadan]);
    expect(g.card(at(g, 'p1', 'characters', S14.dadan)).rested).toBe(false);
    expect(hand(g)).toEqual([S14.whitey]);
    expect(trash(g)).toEqual([EVENT]);
    expect(g.life('p1')).toBe(3);
  });

  it('no leak: with no matching card in hand the "up to 1" pick is still asked (and finished empty)', () => {
    const g = triggered([S14.komachiyo, S14.killer2, S14.marco]);
    activateTrigger(g);
    skipEmpty(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('"up to 1": may play nothing', () => {
    const g = triggered([S14.dadan]);
    activateTrigger(g);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([S14.dadan]);
  });

  it('declining the [Trigger] adds the Event to my hand and plays nothing', () => {
    const g = triggered([S14.dadan]);
    declineTrigger(g);
    expect(hand(g)).toEqual([EVENT, S14.dadan].sort());
    expect(chars(g)).toEqual([]);
  });
});

describe('OP14-018 Time for the Counterattack: cost', () => {
  it('using it as a Counter pays its cost of 1 (one active DON!! is rested)', () => {
    const g = counterBoard(S14.thatch);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });
});
