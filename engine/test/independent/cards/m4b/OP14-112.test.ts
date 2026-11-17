/**
 * OP14-112 Boa Hancock (Character, Yellow, cost 9, 10000; Kuja Pirates / The Seven Warlords of the Sea).
 *
 * Card text:
 *   "[On Play] If your Leader has the {The Seven Warlords of the Sea} type, add up to 1 card from the
 *    top of your deck to the top of your Life cards. Then, add up to 1 card from the top of your
 *    opponent's Life cards to the owner's hand.
 *    [Trigger] Play up to 1 Character card with 6000 power or less and a [Trigger] from your hand."
 *
 * Rules: CR 4-10-1: when the "if" fails, the clause that follows it ("Then, ...") cannot resolve
 * either (the whole effect is under the condition; the printed text is one effect). Taking a Life
 * card by an effect is not damage, so no [Trigger] (QA-GR). "Up to 1" may be zero (CR 8-4-4-1).
 * Trigger: a hand Character with printed power <=6000 and a printed [Trigger]; the cost is not paid.
 * Hand scenery: OP14-114 Ran (5000, [Trigger]), EB04-027 Boa Hancock (7000, [Trigger]), OP01-023
 * Marco (5000, no [Trigger]). Deck top: Komachiyo then Sai.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  hitLeader,
  kind,
  LD,
  LEAD,
  myTurn,
  outcomes,
  playFromHand,
  RED,
  rep,
  settleYes,
  side,
  sortedIds,
  theirTurn,
  TR,
  VAN,
  zoneCards,
} from './kit-d.ts';
import type { PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';

const HAN = 'OP14-112';

function game(leader: string, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(leader, BLUE, {
      hand: [HAN],
      deck: [VAN.komachiyo, VAN.sai, ...rep(BLUE, 10)],
      costArea: { active: 9, rested: 0 },
    }),
    side(LEAD.luffy, RED, { life: [TR.ran, VAN.marco, VAN.marco, VAN.marco], ...p2 }),
  );
}

describe('OP14-112 Boa Hancock [On Play]: Seven Warlords Leader: deck card to Life, then take an opposing Life card', () => {
  it('both parts resolve: Life +1 (the deck top, face-down), opponent Life −1 into the opponent’s hand', () => {
    const g = game(LD.warlord);
    playFromHand(g, HAN);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(5);
    expect(zoneCards(g, 'p1', 'life')[0]).toBe(VAN.komachiyo);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(g.zone('p1', 'deck')).toHaveLength(11);
    expect(g.life('p2')).toBe(3);
    expect(sortedIds(g, 'p2', 'hand')).toContain(TR.ran);
    // Not damage: the [Trigger] on the card taken does not activate.
    expect(kind(g)).toBe('main');
  });

  it('every combination of "up to 1" is reachable, and nothing beyond (no 2nd card either way)', () => {
    const g = game(LD.warlord);
    playFromHand(g, HAN);
    const fp = (x: TestGame) => `${x.life('p1')}|${x.life('p2')}`;
    const ends = outcomes(g, 'p1', fp, 12);
    expect(ends.has('5|3')).toBe(true);
    expect(ends.has('5|4')).toBe(true);
    for (const e of ends) {
      const [a, b] = e.split('|').map(Number);
      expect(a).toBeGreaterThanOrEqual(4);
      expect(a).toBeLessThanOrEqual(5);
      expect(b).toBeGreaterThanOrEqual(3);
      expect(b).toBeLessThanOrEqual(4);
    }
  });

  it('CR 8-4-4-1: choosing nothing for the opponent’s Life leaves it untouched', () => {
    const g = game(LD.warlord);
    playFromHand(g, HAN);
    // Take the deck card, then decline the opposing Life card.
    for (let i = 0; i < 6 && kind(g) !== 'main'; i++) {
      const a = g.legal();
      if (g.life('p1') === 4 && a.some((x) => x.type === 'optional'))
        g.act({ type: 'optional', accept: true });
      else if (g.life('p1') === 4 && a.some((x) => x.type === 'pick'))
        g.act(a.find((x) => x.type === 'pick')!);
      else if (g.life('p1') === 5 && a.some((x) => x.type === 'optional'))
        g.act({ type: 'optional', accept: false });
      else if (g.life('p1') === 5 && a.some((x) => x.type === 'done')) chooseNone(g);
      else if (a.some((x) => x.type === 'done')) g.act({ type: 'done' });
    }
    expect(g.life('p1')).toBe(5);
    expect(g.life('p2')).toBe(4);
  });

  it('CR 4-10-1: a Leader without the Seven Warlords type: no Life added, none taken', () => {
    const g = game(LD.navy);
    playFromHand(g, HAN);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(4);
    expect(g.life('p2')).toBe(4);
    expect(g.zone('p1', 'deck')).toHaveLength(12);
  });

  it('with the opponent at 0 Life the second part has nothing to take', () => {
    const g = game(LD.warlord, { life: [] });
    playFromHand(g, HAN);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(5);
    expect(g.life('p2')).toBe(0);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
  });
});

describe('OP14-112 Boa Hancock [Trigger]: play a Character with 6000 power or less and a [Trigger] from hand', () => {
  function trig() {
    const g = theirTurn(
      side(LD.kuja, BLUE, {
        life: [HAN, ...rep(BLUE, 3)],
        hand: [TR.ran, TR.hancock7000, VAN.marco],
      }),
      side(LEAD.luffy, RED),
    );
    hitLeader(g);
    activateTrigger(g);
    return g;
  }

  it('only a Character with power <=6000 AND a [Trigger] is offered (7000 [Trigger] and 5000 vanilla are not)', () => {
    const g = trig();
    expect(choiceCards(g)).toEqual([TR.ran]);
  });

  it('the chosen Character enters the field without paying its cost', () => {
    const g = trig();
    choose(g, [g.find('p1', 'hand', TR.ran)]);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([TR.ran]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([TR.hancock7000, VAN.marco].sort());
  });

  it('CR 8-4-4-1: up to 1 may be nothing', () => {
    const g = trig();
    chooseNone(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
