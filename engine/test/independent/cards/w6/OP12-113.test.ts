/**
 * OP12-113 Roronoa Zoro (Character, Yellow, cost 5, 6000, Counter +1000, {Straw Hat Crew}/
 * {Supernovas}).
 *
 * Card text: "[On K.O.] If your Leader has the "Supernovas" type, play up to 1 "Supernovas" type
 * Character card with a cost of 4 or less from your hand rested." "[Trigger] K.O. up to 1 of your
 * opponent's Characters with a cost of 1 or less and add this card to your hand."
 *
 * Rules: [On K.O.] fires only when this Character is K.O.'d on the field, by battle or by an effect
 * (CR 10-2-17), and not when it leaves some other way; its condition is checked when it activates;
 * "up to 1" lets me choose none and an "up to" pick over the hand is asked whatever the hand holds;
 * "rested" puts the played card in the rested state; the K.O. frees a place in the Character area
 * before the play (CR 3-7-6-1 only trashes when the area is full at play).
 */
import { describe, expect, it } from 'vitest';
import { act, decision } from '../../helpers.ts';
import {
  at,
  atMain,
  attack,
  chars,
  choices,
  hand,
  kind,
  LW,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  opponentKOs,
  passBlock,
  pickCards,
  pickInst,
  playRaw,
  sorted,
  theirs,
  trash,
  V13,
  W6,
  snap,
  lifeCards,
} from './kit-w6b.ts';

const ZORO = 'OP12-113';
const FILL = 'OP02-060';
/** OP01-002 Trafalgar Law: Green/Red, 5000, {Heart Pirates}/{Supernovas}. [Activate: Main] only. */
const LAW = 'OP01-002';

const rested = (
  g: {
    card: (i: string) => { rested: boolean };
    find: (p: 'p1' | 'p2', z: 'characters', c: string) => string;
  },
  c: string,
) => g.card(g.find('p1', 'characters', c)).rested;

/** p2's turn: a rested Zoro and the given hand/Leader for p1; p2's Kingdew (7000) attacks Zoro. Stops after the K.O. */
function ko(o: { leader?: string; hand?: string[]; chars?: string[] } = {}) {
  const g = theirs(
    o.leader ?? LW.luffy,
    {
      characters: [{ card: ZORO, rested: true }, ...(o.chars ?? [])],
      hand: o.hand ?? [W6.zoroSn4],
    },
    { characters: [W6.kingdew] },
  );
  attack(g, at(g, 'p2', 'characters', W6.kingdew), at(g, 'p1', 'characters', ZORO));
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
  return g;
}

describe('OP12-113 Roronoa Zoro: [On K.O.] with a {Supernovas} Leader play a cost-4-or-less {Supernovas} Character from hand rested; [Trigger] K.O. a cost-1 Character, add this card to hand', () => {
  it('printed values: cost 5, 6000 power, Counter +1000', () => {
    const g = mine(LW.luffy, { characters: [ZORO] });
    const c = g.card(at(g, 'p1', 'characters', ZORO));
    expect(c.cost).toBe(5);
    expect(g.power(c.instance)).toBe(6000);
    expect(c.counter).toBe(1000);
  });

  it("K.O.'d in battle with a {Supernovas} Leader: a {Supernovas} Character of cost 4 or less is played rested", () => {
    const g = ko({ hand: [W6.zoroSn4, W6.apooSn3, W6.urouge5, V13.hajrudin] });
    need(g, 'choose', 'p1');
    // Cost 4 and 3 {Supernovas} are offered; cost 5 {Supernovas} and a cost-4 non-{Supernovas} are not.
    expect(offeredIds(g)).toEqual([W6.zoroSn4, W6.apooSn3].sort());
    pickCards(g, [W6.zoroSn4]);
    expect(atMain(g, 'p2'), snap(g)).toBe(true);
    expect(chars(g)).toEqual([W6.zoroSn4]);
    expect(rested(g, W6.zoroSn4)).toBe(true);
    expect(trash(g)).toEqual([ZORO]);
    expect(hand(g)).toEqual([W6.apooSn3, W6.urouge5, V13.hajrudin].sort());
  });

  it("K.O.'d by an opponent's effect it triggers as well", () => {
    const g = theirs(
      LW.luffy,
      { characters: [ZORO], hand: [W6.apooSn3] },
      { hand: [W6.lightning], costArea: { active: 5, rested: 0 } },
      LW.shanks,
    );
    opponentKOs(g, at(g, 'p1', 'characters', ZORO));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W6.apooSn3]);
    pickCards(g, [W6.apooSn3]);
    expect(chars(g)).toEqual([W6.apooSn3]);
    expect(rested(g, W6.apooSn3)).toBe(true);
  });

  it('"up to 1": I may play nothing', () => {
    const g = ko();
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([W6.zoroSn4]);
    expect(trash(g)).toEqual([ZORO]);
  });

  it('with a Leader that has no {Supernovas} type nothing is played, even with a {Supernovas} card in hand', () => {
    const g = ko({ leader: LW.shanks });
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([W6.zoroSn4]);
    expect(trash(g)).toEqual([ZORO]);
  });

  it('a Leader with {Supernovas} among several types counts (Trafalgar Law)', () => {
    const g = ko({ leader: LAW });
    need(g, 'choose', 'p1');
    pickCards(g, [W6.zoroSn4]);
    expect(chars(g)).toEqual([W6.zoroSn4]);
  });

  it('with no {Supernovas} Character of cost 4 or less in hand the "up to" pick is still asked, empty', () => {
    const g = ko({ hand: [W6.urouge5, V13.hajrudin] });
    expect(kind(g), snap(g)).toBe('choose');
    expect(decision(g)?.player).toBe('p1');
    expect(choices(g)).toEqual([]);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([W6.urouge5, V13.hajrudin].sort());
  });

  it('Zoro leaves the Character area first: with 5 Characters the played one needs no Character trashed', () => {
    const others = [V13.sai, V13.sai, V13.marco, V13.marco];
    const g = ko({ chars: others });
    need(g, 'choose', 'p1');
    pickCards(g, [W6.zoroSn4]);
    expect(atMain(g, 'p2'), snap(g)).toBe(true);
    expect(sorted(g, 'p1', 'characters')).toEqual([...others, W6.zoroSn4].sort());
    expect(trash(g)).toEqual([ZORO]);
  });

  it('it is [On K.O.] only: Zoro trashed from my full Character area as a cost of playing a 6th Character does not trigger it', () => {
    const five = [ZORO, V13.sai, V13.sai, V13.marco, V13.marco];
    const g = mine(LW.luffy, { characters: five, hand: [V13.hajrudin, W6.zoroSn4] });
    playRaw(g, V13.hajrudin);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', ZORO)]);
    expect(atMain(g), snap(g)).toBe(true);
    expect(trash(g)).toEqual([ZORO]);
    expect(hand(g)).toEqual([W6.zoroSn4]);
    expect(chars(g)).not.toContain(W6.zoroSn4);
  });

  it('[Trigger]: K.O. up to 1 Character of cost 1 or less and add this card to my hand', () => {
    const g = theirs(
      LW.luffy,
      { life: [ZORO, FILL, FILL] },
      { characters: [V13.hajrudin, V13.komachiyo, V13.sai] },
    );
    attack(g, at(g, 'p2', 'characters', V13.hajrudin), g.leader('p1'));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.komachiyo]);
    pickCards(g, [V13.komachiyo]);
    expect(chars(g, 'p2')).toEqual([V13.hajrudin, V13.sai].sort());
    expect(hand(g)).toEqual([ZORO]);
    expect(chars(g)).toEqual([]);
    expect(lifeCards(g)).toEqual([FILL, FILL]);
  });
});
