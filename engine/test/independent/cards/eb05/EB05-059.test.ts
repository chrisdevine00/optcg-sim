/**
 * EB05-059 Charlotte Pudding!! (Event, Yellow, cost 1, {Big Mom Pirates}).
 *
 * Card text: "[Main] Draw 1 card, and all of your Characters with 4000 base power and the {Big Mom
 * Pirates} type cannot be K.O.'d in battle until the end of your opponent's next End Phase.
 * [Trigger] Draw 1 card and play up to 1 Character card with 4000 power and a [Trigger] from your
 * hand."
 *
 * Rules: RL-14 / RL-15 ("cannot be K.O.'d in battle" does not stop effect K.O.s), RL-11 (durations
 * into the next turn: here through the opponent's coming turn, ending at its End Phase), CR 8-4-4-1
 * ("up to"), RL-25 (Trigger resolution). Targets are read when the Main resolves.
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, noDefence } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  CH,
  chars,
  choiceCards,
  choose,
  chooseNone,
  declineTrigger,
  decision,
  drive,
  EV,
  fill,
  finishEmpty,
  hand,
  hitLeader,
  kind,
  LD,
  mainEvent,
  mine,
  RED,
  side,
  theirTurn,
  trash,
} from './kit-b.ts';

const ID = 'EB05-059';
const DECK = [CH.thatch, ...fill(BLUE, 14)];
const rested = (card: string) => ({ card, rested: true });

/** p1 plays Pudding's Main with these rested Characters; the opponent has Kingdew (7000). */
function protectedGame(own: string[], oppHand: string[] = [], oppChars: string[] = [CH.kingdew]) {
  const g = mine(
    LD.shc,
    { hand: [ID], characters: own.map(rested), deck: DECK },
    { characters: oppChars, hand: oppHand, costArea: { active: 10, rested: 0 } },
  );
  mainEvent(g, g.find('p1', 'hand', ID));
  return g;
}

/** p2's Kingdew attacks p1's `card` and nobody defends. */
function strike(g: ReturnType<typeof protectedGame>, card: string) {
  attack(g, g.find('p2', 'characters', CH.kingdew), g.find('p1', 'characters', card));
  noDefence(g);
}

describe('EB05-059 Charlotte Pudding!! [Main]: draw 1; my 4000-base {Big Mom Pirates} Characters cannot be K.O.’d in battle', () => {
  it('draws 1 card', () => {
    const g = protectedGame([CH.bobbin]);
    expect(hand(g)).toEqual([CH.thatch]);
  });

  it('control: without the Event a rested 4000-power {Big Mom Pirates} Character dies to a 7000 attacker', () => {
    const g = mine(
      LD.shc,
      { characters: [rested(CH.bobbin)], deck: DECK },
      { characters: [CH.kingdew] },
    );
    endTurn(g);
    strike(g as ReturnType<typeof protectedGame>, CH.bobbin);
    expect(chars(g)).toEqual([]);
  });

  it('protected: the 4000-base {Big Mom Pirates} Character survives the opponent’s attack', () => {
    const g = protectedGame([CH.bobbin]);
    endTurn(g);
    strike(g, CH.bobbin);
    expect(chars(g)).toEqual([CH.bobbin]);
  });

  it('every such Character is covered ("all of your Characters"): Bobbin and Flampe both survive', () => {
    const g = protectedGame([CH.bobbin, CH.flampe], [], [CH.kingdew, CH.hajrudin]);
    endTurn(g);
    strike(g, CH.bobbin);
    attack(g, g.find('p2', 'characters', CH.hajrudin), g.find('p1', 'characters', CH.flampe));
    noDefence(g);
    expect(chars(g)).toEqual([CH.bobbin, CH.flampe].sort());
  });

  it('base power matters: a 6000 {Big Mom Pirates} Character (Opera) is not protected', () => {
    const g = protectedGame([CH.opera]);
    endTurn(g);
    strike(g, CH.opera);
    expect(chars(g)).toEqual([]);
  });

  it('a 3000 {Big Mom Pirates} Character (Anana) is not protected', () => {
    const g = protectedGame([CH.anana]);
    endTurn(g);
    strike(g, CH.anana);
    expect(chars(g)).toEqual([]);
  });

  it('the type matters: a 4000-power Character of another type (Sai) is not protected', () => {
    const g = protectedGame([CH.sai]);
    endTurn(g);
    strike(g, CH.sai);
    expect(chars(g)).toEqual([]);
  });

  it('"in battle" only: an effect K.O. (Kingdom Come) still K.O.s the protected Character', () => {
    const g = protectedGame([CH.bobbin], [EV.kingdom]);
    endTurn(g);
    g.act({ type: 'playCard', card: g.find('p2', 'hand', EV.kingdom) });
    drive(g, 'p2', { picks: [[g.find('p1', 'characters', CH.bobbin)]] });
    expect(chars(g)).toEqual([]);
  });

  it('RL-11: the protection ends at the opponent’s End Phase: on their following turn the same Character can be K.O.’d', () => {
    const g = protectedGame([CH.bobbin]);
    const bobbin = g.find('p1', 'characters', CH.bobbin);
    endTurn(g);
    strike(g, CH.bobbin);
    expect(chars(g)).toEqual([CH.bobbin]);
    endTurn(g); // p2's End Phase: the protection ends
    // p1's turn 5: Bobbin attacks (and is rested again), then p2 hits it on turn 6.
    attack(g, bobbin, g.leader('p2'));
    noDefence(g);
    endTurn(g);
    strike(g, CH.bobbin);
    expect(chars(g)).toEqual([]);
  });
});

describe('EB05-059 Charlotte Pudding!! [Trigger]: draw 1 and play up to 1 Character with 4000 power and a [Trigger] from hand', () => {
  function hit(handCards: string[]) {
    const g = theirTurn(
      side(LD.shc, BLUE, { life: [ID, ...fill(BLUE, 3)], hand: handCards, deck: DECK }),
      side(LD.shc, RED),
    );
    hitLeader(g, g.leader('p2'));
    return g;
  }

  it('draws 1, then offers only Characters with exactly 4000 power and a [Trigger]', () => {
    const g = hit([CH.daifuku, 'EB05-051', CH.trigSpeed, CH.sai, CH.trig7000]);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(choiceCards(g)).toEqual([CH.daifuku, 'EB05-051'].sort());
    expect(hand(g)).toContain(CH.thatch);
  });

  it('plays the chosen Character for free; Pudding ends in the trash', () => {
    const g = hit([CH.daifuku]);
    activateTrigger(g);
    choose(g, [g.find('p1', 'hand', CH.daifuku)]);
    expect(chars(g)).toEqual([CH.daifuku]);
    expect(trash(g)).toEqual([ID]);
  });

  it('"up to 1": playing nothing is allowed (the card is still drawn)', () => {
    const g = hit([CH.daifuku]);
    activateTrigger(g);
    chooseNone(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([CH.daifuku, CH.thatch].sort());
  });

  it('with no candidate in hand the card is drawn and nothing is played', () => {
    const g = hit([CH.sai]);
    activateTrigger(g);
    finishEmpty(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([CH.sai, CH.thatch].sort());
    expect(decision(g)?.kind).toBe('main');
  });

  it('declining the Trigger puts Pudding in hand and draws nothing', () => {
    const g = hit([CH.daifuku]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID, CH.daifuku].sort());
  });
});
