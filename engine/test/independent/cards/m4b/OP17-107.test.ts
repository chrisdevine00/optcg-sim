/**
 * OP17-107 Charlotte Daifuku (Character, Yellow, cost 3, 4000, Counter +2000, {Big Mom Pirates}).
 *
 * Card text: no effect text. "[Trigger] Play this card."
 *
 * Rules: CR 10-1-5 ([Trigger]: optional; the card is in no area while it resolves), CR 8-4-3,
 * CR 3-7-6 (Character area limit of 5: trash one to play a sixth).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  activateTrigger,
  chars,
  don,
  choices,
  choose,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  mine,
  playCard,
  RED,
  settleYes,
  theirs,
  trash,
  VAN,
  YL,
} from './kit-a.ts';

function hit(characters: string[] = []) {
  const g = theirs(YL.bmp, { life: ['OP17-107', ...fill(RED, 3)], characters });
  hitLeader(g);
  return g;
}

describe('OP17-107 Charlotte Daifuku: [Trigger] play this card', () => {
  it('activating plays Daifuku from the Life card onto the field (not to hand, not to trash)', () => {
    const g = hit();
    activateTrigger(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual(['OP17-107']);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.find('p1', 'characters', 'OP17-107'))).toBe(4000);
  });

  it('declining the [Trigger] puts the Life card into hand', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual(['OP17-107']);
    expect(chars(g)).toEqual([]);
  });

  it('CR 3-7-6: with 5 Characters in play, activating asks which one to trash, then Daifuku enters', () => {
    const five = [VAN.sunny, VAN.sai, VAN.marco, VAN.hajrudin, VAN.kingdew];
    const g = hit(five);
    activateTrigger(g);
    expect(kind(g)).toBe('choose');
    const victim = choices(g).find((i) => g.card(i).card === VAN.sai)!;
    choose(g, [victim]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([...five.filter((c) => c !== VAN.sai), 'OP17-107'].sort());
    expect(trash(g)).toEqual([VAN.sai]);
  });

  it('played from hand it is an ordinary 3-cost Character: no decision follows', () => {
    const g = mine(YL.bmp, { hand: ['OP17-107'], costArea: { active: 3, rested: 0 } });
    playCard(g, 'OP17-107');
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual(['OP17-107']);
    expect(don(g).active).toBe(0);
  });
});
