/**
 * EB05-011 Otohime (Character, Green, cost 1, 0, Counter +2000, {Merfolk}/{Fish-Man Island}, Wisdom).
 *
 * Card text: "[On Play] If your Leader is [Shirahoshi], you may turn 1 card from the top of your Life
 * cards face-down: Rest up to 1 of your opponent's Characters with a cost of 5 or less."
 *
 * Rules: CR 8-3-3 (text after a failed "if" does not resolve), CR 8-3-1-3/-4 (costs), CR 1-3-2-1
 * (a card cannot be turned to the state it already has), CR 8-4-4-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import {
  accept,
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  decline,
  EL,
  kind,
  mine,
  offered,
  offeredInstance,
  playCard,
  RED,
  settleYes,
  skipUnusable,
  VAN,
} from './kit-eb05a.ts';

const OTOHIME = 'EB05-011';
const UP = { card: RED, faceUp: true };

function played(leader: string, life: (string | { card: string; faceUp: boolean })[]) {
  const g = mine(
    leader,
    { hand: [OTOHIME], life, deck: fill(BLUE, 10) },
    { characters: [VAN.kingdew, VAN.thatch, VAN.hajrudin] },
  );
  playCard(g, OTOHIME);
  return g;
}
const rested = (g: ReturnType<typeof played>, card: string) =>
  g.card(g.find('p2', 'characters', card)).rested;

describe('EB05-011 Otohime: [On Play] Leader [Shirahoshi]: turn the top Life card face-down: rest a Character with cost 5 or less', () => {
  it('paying: the top Life card is turned face-down and the chosen Character is rested', () => {
    const g = played(EL.shirahoshi, [UP, RED, RED, RED]);
    expect(offered(g, 'p1')).toBe(true);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    accept(g);
    choose(g, [offeredInstance(g, VAN.kingdew)]);
    settleYes(g, 'p1');
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(g.life('p1')).toBe(4);
    expect(rested(g, VAN.kingdew)).toBe(true);
    expect(rested(g, VAN.hajrudin)).toBe(false);
  });

  it('cost boundary: cost 5 and cost 4 are candidates, cost 6 is not', () => {
    const g = played(EL.shirahoshi, [UP, RED, RED, RED]);
    accept(g);
    expect(choiceCards(g)).toEqual([VAN.hajrudin, VAN.kingdew].sort());
  });

  it('"up to 1": after paying, may rest nothing (the Life card is still turned)', () => {
    const g = played(EL.shirahoshi, [UP, RED, RED, RED]);
    accept(g);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(rested(g, VAN.kingdew)).toBe(false);
  });

  it('CR 8-3-1-4: declining the cost leaves the Life card and the opposing Characters alone', () => {
    const g = played(EL.shirahoshi, [UP, RED, RED, RED]);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(rested(g, VAN.kingdew)).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('CR 1-3-2-1: a top Life card that is already face-down cannot be turned face-down: the cost cannot be paid', () => {
    const g = played(EL.shirahoshi, [RED, RED, RED, RED]);
    skipUnusable(g, 'p1');
    expect(rested(g, VAN.kingdew)).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('only the TOP Life card counts: face-up cards further down do not pay the cost', () => {
    const g = played(EL.shirahoshi, [RED, UP, UP, RED]);
    skipUnusable(g, 'p1');
    expect(rested(g, VAN.kingdew)).toBe(false);
    expect(g.zone('p1', 'life')[1]!.faceUp).toBe(true);
  });

  it('CR 8-3-3: with a Leader that is not [Shirahoshi] nothing is asked and nothing is rested', () => {
    const g = played(EL.croc, [UP, RED, RED, RED]);
    skipUnusable(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(rested(g, VAN.kingdew)).toBe(false);
  });

  it('with 0 Life cards the cost cannot be paid', () => {
    const g = played(EL.shirahoshi, []);
    skipUnusable(g, 'p1');
    expect(rested(g, VAN.kingdew)).toBe(false);
  });

  it('the rest lasts until the opponent’s Refresh Phase: the Character is active again in their Main Phase', () => {
    const g = played(EL.shirahoshi, [UP, RED, RED, RED]);
    accept(g);
    choose(g, [offeredInstance(g, VAN.kingdew)]);
    settleYes(g, 'p1');
    expect(rested(g, VAN.kingdew)).toBe(true);
    endTurn(g);
    expect(g.card(g.find('p2', 'characters', VAN.kingdew)).rested).toBe(false);
  });
});
