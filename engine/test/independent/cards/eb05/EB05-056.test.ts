/**
 * EB05-056 Nico Olvia (Character, Yellow, cost 1, 0 power, Counter +2000, {Ohara}).
 *
 * Card text: "[On Play] You may trash 1 card with a Trigger from your hand: If your Leader is
 * [Nico Robin], draw 2 cards.
 * [Trigger] Play this card."
 *
 * Rules: CR 8-3-1-3/-4 (an optional cost: skipped or unpayable means no effect), CR 8-3-3 (the "if"
 * is read after the cost, so a non-Robin Leader still pays but draws nothing), CR 2-1-2 ("Leader is
 * [Nico Robin]" is an exact name, whatever the Leader card), RL-25 (the [Trigger] play is free; the
 * card is in no area while it resolves), "a card with a Trigger" is any card category with a [Trigger].
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  activateTrigger,
  BLUE,
  CH,
  chars,
  choose,
  decline,
  deck,
  drive,
  EV,
  fill,
  hand,
  hitLeader,
  kind,
  LD,
  mine,
  playCard,
  RED,
  reachablePickSets,
  side,
  theirTurn,
  trash,
} from './kit-b.ts';

const ID = 'EB05-056';
const SPEED = CH.trigSpeed;
const TOP = [CH.thatch, CH.hajrudin, ...fill(BLUE, 13)];

function play(leader: string, handCards: string[] = [SPEED, CH.marco]) {
  const g = mine(leader, { hand: [ID, ...handCards], deck: TOP });
  playCard(g, ID);
  return g;
}

describe('EB05-056 Nico Olvia [On Play]: trash 1 Trigger card from hand: Leader [Nico Robin]: draw 2', () => {
  it('Leader [Nico Robin] (OP09-062): trash a Trigger card, draw 2', () => {
    const g = play(LD.robin);
    accept(g);
    choose(g, [g.find('p1', 'hand', SPEED)]);
    expect(trash(g)).toEqual([SPEED]);
    expect(hand(g)).toEqual([CH.marco, CH.thatch, CH.hajrudin].sort());
    expect(deck(g)).toHaveLength(13);
  });

  it('the other Leader named [Nico Robin] (EB05-010) qualifies too', () => {
    const g = play('EB05-010');
    accept(g);
    choose(g, [g.find('p1', 'hand', SPEED)]);
    expect(hand(g)).toHaveLength(3);
  });

  it('CR 8-3-3: a Leader with another name (ST01-001): the cost is paid but nothing is drawn', () => {
    const g = play(LD.shc);
    accept(g);
    choose(g, [g.find('p1', 'hand', SPEED)]);
    expect(trash(g)).toEqual([SPEED]);
    expect(hand(g)).toEqual([CH.marco]);
    expect(deck(g)).toHaveLength(15);
  });

  it('only cards with a Trigger can pay: a Character with a [Trigger] and an Event with a [Trigger], not Marco', () => {
    const g = mine(LD.robin, { hand: [ID, SPEED, EV.trigEvent, CH.marco], deck: TOP });
    playCard(g, ID);
    accept(g);
    const sets = reachablePickSets(g);
    expect([...sets].sort()).toEqual([EV.trigEvent, SPEED].sort());
  });

  it('exactly 1 card is trashed (not 2), exactly 2 are drawn', () => {
    const g = play(LD.robin, [SPEED, CH.trigCarrot, CH.marco]);
    accept(g);
    choose(g, [g.find('p1', 'hand', SPEED)]);
    expect(trash(g)).toHaveLength(1);
    expect(hand(g)).toHaveLength(2 + 2);
  });

  it('declining the optional cost: nothing is trashed, nothing is drawn', () => {
    const g = play(LD.robin);
    decline(g);
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([SPEED, CH.marco].sort());
    expect(deck(g)).toHaveLength(15);
    expect(chars(g)).toEqual([ID]);
  });

  it('CR 8-3-1-3: with no Trigger card in hand the cost cannot be paid: nothing is drawn', () => {
    const g = play(LD.robin, [CH.marco]);
    drive(g, 'p1', {});
    expect(hand(g)).toEqual([CH.marco]);
    expect(deck(g)).toHaveLength(15);
  });
});

describe('EB05-056 Nico Olvia [Trigger]: play this card', () => {
  function hit() {
    const g = theirTurn(
      side(LD.robin, BLUE, {
        life: [ID, ...fill(BLUE, 3)],
        hand: [SPEED],
        deck: TOP,
      }),
      side(LD.shc, RED),
    );
    hitLeader(g, g.leader('p2'));
    return g;
  }

  it('activating plays Olvia for free and her [On Play] then runs (the cost is asked)', () => {
    const g = hit();
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(chars(g)).toEqual([ID]);
    expect(kind(g)).toBe('optional');
    accept(g);
    choose(g, [g.find('p1', 'hand', SPEED)]);
    expect(hand(g)).toEqual([CH.thatch, CH.hajrudin].sort());
  });
});
