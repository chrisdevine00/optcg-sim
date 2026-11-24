/**
 * OP13-115 Paper Art Afterimage (Event, Yellow, cost 2, {CP0}/{Egghead}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +3000 power during this battle.
 * Then, if your opponent has 2 or less Life cards, up to 1 of your Leader or Character cards gains
 * +1000 power during this turn. [Trigger] Draw 1 card."
 *
 * Rules: CR 7-1-3-1-2 (Event [Counter]), CR 7-1-5-3 ("during this battle" ends with the battle),
 * CR 8-1-4-2 ("during this turn"), CR 8-4-4-1 ("up to"), RD 101 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  activateTrigger,
  at,
  attack,
  BLUE,
  canCounterWith,
  canPlayFromHand,
  declineTrigger,
  deck,
  doneRaw,
  don,
  hand,
  hitLeader,
  kind,
  LD13,
  need,
  passCounter,
  pickRaw,
  RED,
  SC15,
  theirs,
  trash,
  useCounter,
  mine,
} from './kit-op13d.ts';

const ID = 'OP13-115';

function defend(
  o: { oppLife?: number; own?: (string | { card: string; rested?: boolean })[] } = {},
): TestGame {
  const g = theirs(
    LD13.yellow,
    { hand: [ID], costArea: { active: 3, rested: 0 }, characters: o.own ?? [SC15.red3] },
    {
      characters: [SC15.red5],
      life: Array.from({ length: o.oppLife ?? 4 }, () => RED),
    },
  );
  attack(g, at(g, 'p2', 'characters', SC15.red5), g.leader('p1'));
  g.act({ type: 'block', blocker: null });
  return g;
}

const use = (g: TestGame) => useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));

describe('OP13-115 Paper Art Afterimage: [Counter] +3000 this battle; then if the opponent has 2 or less Life, +1000 this turn', () => {
  it('+3000 on my Leader (8000) beats a 7000 attacker: no Life is lost, 2 DON!! are spent', () => {
    const g = defend();
    expect(canCounterWith(g, g.find('p1', 'hand', ID))).toBe(true);
    use(g);
    need(g, 'choose', 'p1');
    pickRaw(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(kind(g)).toBe('counter');
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(don(g)).toMatchObject({ active: 1, rested: 2 });
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: opponent with 2 Life: the second boost is offered and lasts the whole turn (after the battle too)', () => {
    const g = defend({ oppLife: 2 });
    use(g);
    pickRaw(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    pickRaw(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(9000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('boundary: opponent with 3 Life: only the battle boost, no second question', () => {
    const g = defend({ oppLife: 3 });
    use(g);
    pickRaw(g, g.leader('p1'));
    expect(kind(g)).toBe('counter');
    expect(g.power(g.leader('p1'))).toBe(8000);
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('an opponent with 0 Life is "2 or less": the second boost applies', () => {
    const g = defend({ oppLife: 0 });
    use(g);
    pickRaw(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    pickRaw(g, g.leader('p1'));
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the two boosts may go to different cards: +3000 to a Character, +1000 to the Leader', () => {
    const g = defend({ oppLife: 1 });
    const m = at(g, 'p1', 'characters', SC15.red3);
    use(g);
    need(g, 'choose', 'p1');
    pickRaw(g, m);
    need(g, 'choose', 'p1');
    pickRaw(g, g.leader('p1'));
    expect(g.power(m)).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(6000);
    passCounter(g);
    expect(g.power(m)).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the opponent’s cards are not candidates for either boost', () => {
    const g = defend({ oppLife: 1 });
    use(g);
    need(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'pick' && a.choice === g.leader('p2'))).toBe(false);
    pickRaw(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'pick' && a.choice === g.leader('p2'))).toBe(false);
  });

  it('"up to 1": the battle boost may be skipped, and then the attack connects', () => {
    const g = defend({ oppLife: 4 });
    use(g);
    need(g, 'choose', 'p1');
    doneRaw(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('a [Counter]-only Event cannot be played in the Main Phase', () => {
    const g = mine(LD13.yellow, { hand: [ID] }, {});
    expect(canPlayFromHand(g, g.find('p1', 'hand', ID))).toBe(false);
  });

  it('[Trigger]: activated from the Life, it draws 1 card and nothing else', () => {
    const g = theirs(LD13.yellow, { life: [ID, BLUE, BLUE, BLUE], hand: [SC15.red2] }, {});
    const before = deck(g).length;
    hitLeader(g);
    activateTrigger(g);
    expect(hand(g)).toEqual([BLUE, SC15.red2].sort());
    expect(deck(g)).toHaveLength(before - 1);
    expect(trash(g)).toEqual([ID]);
    expect(kind(g)).toBe('main');
  });

  it('[Trigger] declined: the Event is added to the hand and no card is drawn', () => {
    const g = theirs(LD13.yellow, { life: [ID, BLUE, BLUE, BLUE], hand: [] }, {});
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
  });
});
