/**
 * EB05-054 Charlotte Brulee (Character, Yellow, cost 3, 4000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[Trigger] Play up to 2 {Big Mom Pirates} type Character cards with 4000 power from your
 * hand."
 *
 * Rules: a card with no timing keyword and no [Trigger] text has no effect while in hand or on the
 * field; "with 4000 power" is the card's printed power as a card in hand (exact, not "or less");
 * CR 8-4-4-1 ("up to"); RL-25 (the [Trigger] card is in no area while it resolves; declining puts it
 * in hand); effect-played cards cost nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  BLUE,
  CH,
  chars,
  choiceCards,
  choose,
  chooseNone,
  declineTrigger,
  don,
  fill,
  hand,
  hitLeader,
  kind,
  LD,
  mine,
  playCard,
  reachablePickSets,
  RED,
  side,
  theirTurn,
  trash,
} from './kit-b.ts';

const ID = 'EB05-054';

function hit(handCards: string[]) {
  const g = theirTurn(
    side(LD.shc, BLUE, {
      life: [ID, ...fill(BLUE, 3)],
      hand: handCards,
      costArea: { active: 0, rested: 0 },
    }),
    side(LD.shc, RED),
  );
  hitLeader(g, g.leader('p2'));
  return g;
}

describe('EB05-054 Charlotte Brulee [Trigger]: play up to 2 {Big Mom Pirates} Characters with 4000 power from hand', () => {
  it('plays both 4000-power {Big Mom Pirates} Characters from hand for free', () => {
    const g = hit([CH.bobbin, CH.flampe, CH.mohji]);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(choiceCards(g)).toEqual([CH.bobbin, CH.flampe].sort());
    choose(g, [g.find('p1', 'hand', CH.bobbin), g.find('p1', 'hand', CH.flampe)]);
    expect(chars(g)).toEqual([CH.bobbin, CH.flampe].sort());
    expect(hand(g)).toEqual([CH.mohji]);
    expect(don(g).active + don(g).rested).toBe(0);
  });

  it('exact power: a 3000 {Big Mom Pirates} (Anana) and a 6000 one (Opera) are not candidates', () => {
    const g = hit([CH.anana, CH.opera, CH.bobbin]);
    activateTrigger(g);
    expect(choiceCards(g)).toEqual([CH.bobbin]);
  });

  it('the type matters: a 4000-power Character of another type (Sai) is not a candidate', () => {
    const g = hit([CH.sai, CH.bobbin]);
    activateTrigger(g);
    expect(choiceCards(g)).toEqual([CH.bobbin]);
  });

  it('"up to 2": with three candidates at most two can be played', () => {
    const g = hit([CH.bobbin, CH.bobbin, CH.flampe]);
    activateTrigger(g);
    const sets = reachablePickSets(g);
    expect(sets.has(`${CH.bobbin}+${CH.bobbin}`)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
  });

  it('"up to 2": playing only one, or none, is allowed', () => {
    const g = hit([CH.bobbin, CH.flampe]);
    activateTrigger(g);
    chooseNone(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([CH.bobbin, CH.flampe].sort());
  });

  it('RL-25: Brulee herself ends in the trash (she is not one of the cards that can be played)', () => {
    const g = hit([CH.bobbin]);
    activateTrigger(g);
    choose(g, [g.find('p1', 'hand', CH.bobbin)]);
    expect(trash(g)).toEqual([ID]);
  });

  it('declining the Trigger: Brulee is added to hand and nothing is played', () => {
    const g = hit([CH.bobbin]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID, CH.bobbin].sort());
    expect(chars(g)).toEqual([]);
  });

  it('with no candidate in hand the Trigger plays nothing (and asks nothing)', () => {
    const g = hit([CH.mohji]);
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([CH.mohji]);
  });
});

describe('EB05-054 Charlotte Brulee: no effect outside a [Trigger]', () => {
  it('playing her from hand does nothing else (the Trigger is not an [On Play])', () => {
    const g = mine(LD.shc, { hand: [ID, CH.bobbin] });
    playCard(g, ID);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([CH.bobbin]);
  });
});
