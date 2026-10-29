/**
 * OP17-061 Lead Performers (Character, Purple, cost 9, 11000, no Counter, types Fish-Man / Animal
 * Kingdom Pirates).
 *
 * Card text (cards/data; the normalizer restored the sign of "DON!! −1", textFixes):
 *   "[On Play] DON!! −1: If your Leader has the {Animal Kingdom Pirates} type, add up to 1 card from
 *    the top of your deck to the top of your Life cards.
 *    [Activate: Main] You may trash this Character: Play up to 1 [King], [Queen], or [Jack] from your
 *    hand."
 *
 * Rules: QA-GR "[On Play] with a cost may be declined" (digest item 112); DON!! −X may return rested
 * cost-area DON!! (CR 8-3-1-6, RL-23/RL-24); CR 4-10-1 failed "if"; CR 2-1-2 ([Name] is an exact
 * name); CR 3-7-4 (a Character played this turn cannot attack); a card played by an effect pays no
 * cost; a "trash this Character" cost is not "rest", so it works on the turn it was played.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act } from '../helpers.ts';
import {
  accept,
  AKP,
  activate,
  canActivate,
  canAttackAny,
  choiceCards,
  choose,
  chooseNone,
  count,
  decline,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  side,
  sortedIds,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

/** OP04-049 Jack (Blue, cost 2; [On K.O.] only) and ST04-008 is not used: no [On Play] to answer. */
const JACK = 'OP04-049';

function game(p1: Partial<PlayerSpec>, leader: string = LEAD.kaido) {
  return myTurn(side(leader, PURPLE, p1), side(LEAD.luffy, RED));
}

function playLead(g: TestGame): void {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.leadPerformers) });
}

describe('OP17-061 Lead Performers: [On Play] DON!! −1 → deck top to Life', () => {
  it('happy path (AKP Leader): return 1 DON!!, the deck’s top card becomes the top Life card', () => {
    const g = game({
      hand: [AKP.leadPerformers],
      costArea: { active: 9, rested: 0 },
      deck: [VAN.marco, VAN.sai, ...[PURPLE, PURPLE, PURPLE]],
    });
    playLead(g);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1, 'costRested');
    if (offered(g, 'p1')) accept(g); // "up to 1" asked as a yes/no
    expect(g.life('p1')).toBe(5);
    expect(g.zone('p1', 'life')[0]!.card).toBe(VAN.marco);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(VAN.sai);
    expect(donOf(g, 'p1').deck).toBe(2);
  });

  it('CR 4-10-1: with a non-AKP Leader the DON!! is still returned but no Life is added', () => {
    const g = game({ hand: [AKP.leadPerformers], costArea: { active: 9, rested: 0 } }, LEAD.shanks);
    playLead(g);
    accept(g);
    payDon(g, 1, 'costRested');
    expect(g.life('p1')).toBe(4);
    expect(count(g, 'p1', 'deck')).toBe(15);
    expect(donOf(g, 'p1').deck).toBe(2);
    expect(kind(g)).toBe('main');
  });

  it('QA-GR: the DON!! −1 [On Play] may be declined; nothing happens and the Character stays', () => {
    const g = game({ hand: [AKP.leadPerformers], costArea: { active: 9, rested: 0 } });
    playLead(g);
    decline(g);
    expect(g.life('p1')).toBe(4);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 9, deck: 1 });
    expect(sortedIds(g, 'p1', 'characters')).toEqual([AKP.leadPerformers]);
  });
});

describe('OP17-061 Lead Performers: [Activate: Main] trash this → play [King], [Queen] or [Jack]', () => {
  const hand = [AKP.king, AKP.queen1, JACK, VAN.gordon, VAN.blackMaria];

  it('happy path: trash this Character and play [King] from hand without paying its cost', () => {
    const g = game({ characters: [AKP.leadPerformers], hand, costArea: { active: 0, rested: 0 } });
    activate(g, g.find('p1', 'characters', AKP.leadPerformers));
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.leadPerformers]);
    choose(g, [g.find('p1', 'hand', AKP.king)]);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([AKP.king]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 0 });
    // CR 3-7-4: King was played this turn and has no [Rush].
    expect(canAttackAny(g, g.find('p1', 'characters', AKP.king))).toBe(false);
  });

  it('CR 2-1-2: only cards named exactly [King], [Queen] or [Jack] are offered', () => {
    const g = game({ characters: [AKP.leadPerformers], hand });
    activate(g, g.find('p1', 'characters', AKP.leadPerformers));
    expect(choiceCards(g)).toEqual([AKP.king, AKP.queen1, JACK].sort());
  });

  it('CR 8-4-4-1: "up to 1" may play nothing; the trash cost is still paid', () => {
    const g = game({ characters: [AKP.leadPerformers], hand });
    activate(g, g.find('p1', 'characters', AKP.leadPerformers));
    chooseNone(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.leadPerformers]);
    expect(count(g, 'p1', 'hand')).toBe(hand.length);
  });

  it('a "trash this Character" cost can be paid on the turn it was played', () => {
    const g = game({
      characters: [{ card: AKP.leadPerformers, playedThisTurn: true }],
      hand,
    });
    expect(canActivate(g, g.find('p1', 'characters', AKP.leadPerformers))).toBe(true);
  });

  it('no [Once Per Turn]: it can be activated while rested (the cost is trash, not rest)', () => {
    const g = game({ characters: [{ card: AKP.leadPerformers, rested: true }], hand });
    expect(canActivate(g, g.find('p1', 'characters', AKP.leadPerformers))).toBe(true);
  });
});
