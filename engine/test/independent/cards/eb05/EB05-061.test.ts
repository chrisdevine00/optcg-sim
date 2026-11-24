/**
 * EB05-061 Nami (Character, Red, cost 3, 4000, Counter +2000, {Straw Hat Crew}).
 *
 * Card text: "[Once Per Turn] If one of your Characters with 6000 base power or less would be removed
 * from the field by your opponent, you may add 1 card from the top of your Life cards to your hand
 * instead.
 * [On Play] Play up to 1 red Character card with a cost of 2 or less from your hand."
 *
 * Rules: RL-31 (a replacement is optional with "you may"), M6b-Q7 (read as "removed from the field
 * by your opponent['s effect]"; the printed text has no "effect": battle K.O. is NOT asserted here),
 * RL-33 (BASE power), RD 104 (a Life card moved by an effect never activates [Trigger]), CR 8-4-4-1
 * ("up to"), "Once Per Turn" is one use per turn. Opposing removal is made with scripted cards:
 * EB01-059 Kingdom Come (K.O.), OP06-058 Gravity Blade (bottom of the deck), OP09-077 Gum-Gum
 * Lightning (K.O. up to 1 with 6000 power or less).
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  CH,
  chars,
  choiceCards,
  choose,
  chooseNone,
  drive,
  EV,
  fill,
  finishEmpty,
  hand,
  kind,
  LD,
  mine,
  play,
  playCard,
  side,
  theirTurn,
  trash,
} from './kit-b.ts';

const ID = 'EB05-061';
const LIGHTNING = 'OP09-077';

describe('EB05-061 Nami [On Play]: play up to 1 red Character with cost <= 2 from hand', () => {
  const go = (handCards: string[]) => {
    const g = mine(LD.shc, { hand: [ID, ...handCards] });
    playCard(g, ID);
    return g;
  };

  it('offers only red Characters with cost 2 or less: Sai (2) and Komachiyo (1), not Marco (3), not Mohji (blue)', () => {
    const g = go([CH.sai, CH.komachiyo, CH.marco, CH.mohji]);
    expect(choiceCards(g)).toEqual([CH.sai, CH.komachiyo].sort());
  });

  it('the chosen Character is played without paying its cost', () => {
    const g = go([CH.sai]);
    choose(g, [g.find('p1', 'hand', CH.sai)]);
    expect(chars(g)).toEqual([CH.sai, ID].sort());
    expect(hand(g)).toEqual([]);
  });

  it('"up to 1": playing nothing is allowed', () => {
    const g = go([CH.sai]);
    chooseNone(g);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([CH.sai]);
  });

  it('only one Character is played even with two candidates', () => {
    const g = go([CH.sai, CH.komachiyo]);
    choose(g, [g.find('p1', 'hand', CH.sai)]);
    expect(chars(g)).toHaveLength(2);
    expect(kind(g)).toBe('main');
  });

  it('with no red cost-<=2 Character in hand nothing is asked', () => {
    const g = go([CH.marco, CH.mohji]);
    finishEmpty(g); // the engine asks a forced empty pick (min = max = 0)
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([ID]);
  });
});

describe('EB05-061 Nami [Once Per Turn]: my Character with 6000 base power or less would be removed by my opponent: may add my top Life card to hand instead', () => {
  /** p2's turn; p2 holds `events`; p1 has Nami, Sai and Kingdew; 4 Life with `life` on top. */
  function game(events: string[], o: { own?: string[]; life?: string[] } = {}) {
    return theirTurn(
      side(LD.shc, BLUE, {
        characters: o.own ?? [ID, CH.sai, CH.kingdew],
        life: o.life ?? fill(BLUE, 4),
      }),
      side(LD.shc, 'P-015', { hand: events, costArea: { active: 10, rested: 0 } }),
    );
  }

  /** p2 plays `event` on p1's `target`; p1 answers a replacement question with `answer`. */
  function remove(g: ReturnType<typeof game>, event: string, target: string, answer: boolean) {
    play(g, g.find('p2', 'hand', event));
    drive(g, 'p2', { picks: [[g.find('p1', 'characters', target)]] });
    drive(g, 'p1', { use: [answer] });
  }

  it('accepting: the Character stays, the top Life card goes to hand', () => {
    const g = game([EV.kingdom]);
    const top = g.zone('p1', 'life')[0]!.card;
    remove(g, EV.kingdom, CH.sai, true);
    expect(chars(g)).toEqual([ID, CH.sai, CH.kingdew].sort());
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([top]);
    expect(trash(g)).toEqual([]);
  });

  it('declining ("you may"): the Character is removed and no Life card moves', () => {
    const g = game([EV.kingdom]);
    remove(g, EV.kingdom, CH.sai, false);
    expect(chars(g)).toEqual([ID, CH.kingdew].sort());
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
  });

  it('Nami herself (4000 base) is covered', () => {
    const g = game([EV.kingdom]);
    remove(g, EV.kingdom, ID, true);
    expect(chars(g)).toContain(ID);
    expect(g.life('p1')).toBe(3);
  });

  it('RL-33: a 6000-base Character (Hajrudin) is covered; a 7000-base one (Kingdew) is not and is simply K.O.’d', () => {
    const covered = game([EV.kingdom], { own: [ID, CH.hajrudin] });
    remove(covered, EV.kingdom, CH.hajrudin, true);
    expect(chars(covered)).toEqual([ID, CH.hajrudin].sort());
    const not = game([EV.kingdom]);
    play(not, not.find('p2', 'hand', EV.kingdom));
    drive(not, 'p2', { picks: [[not.find('p1', 'characters', CH.kingdew)]] });
    expect(kind(not)).toBe('main');
    expect(chars(not)).toEqual([ID, CH.sai].sort());
    expect(not.life('p1')).toBe(4);
  });

  it('it covers any removal by the opponent, not only K.O.: Gravity Blade (to the deck bottom) is replaced too', () => {
    const g = game([EV.gravity]);
    remove(g, EV.gravity, CH.sai, true);
    expect(chars(g)).toContain(CH.sai);
    expect(g.life('p1')).toBe(3);
  });

  it('[Once Per Turn]: a second removal in the same turn is not replaced', () => {
    const g = game([EV.kingdom, LIGHTNING]);
    remove(g, EV.kingdom, CH.sai, true);
    expect(chars(g)).toContain(CH.sai);
    play(g, g.find('p2', 'hand', LIGHTNING));
    drive(g, 'p2', { picks: [[g.find('p1', 'characters', CH.sai)]] });
    drive(g, 'p1', { use: [true] });
    expect(chars(g)).not.toContain(CH.sai);
    expect(g.life('p1')).toBe(3);
  });

  it('RD 104: the Life card added to hand by the replacement does not activate its [Trigger]', () => {
    const g = game([EV.kingdom], { life: [CH.trigSpeed, ...fill(BLUE, 3)] });
    remove(g, EV.kingdom, CH.sai, true);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([CH.trigSpeed]);
  });

  it('with no Life cards the replacement cannot be used: the Character is removed', () => {
    const g = game([EV.kingdom], { life: [] });
    play(g, g.find('p2', 'hand', EV.kingdom));
    drive(g, 'p2', { picks: [[g.find('p1', 'characters', CH.sai)]] });
    drive(g, 'p1', { use: [true] });
    expect(chars(g)).not.toContain(CH.sai);
  });

  it('only removal by the OPPONENT: my own Gravity Blade on my own Character is not replaced', () => {
    const g = mine(LD.navy, { hand: [EV.gravity], characters: [ID, CH.sai], life: fill(BLUE, 4) });
    play(g, g.find('p1', 'hand', EV.gravity));
    choose(g, [g.find('p1', 'characters', CH.sai)]);
    drive(g, 'p1', { use: [true] });
    expect(chars(g)).not.toContain(CH.sai);
    expect(g.life('p1')).toBe(4);
  });
});
