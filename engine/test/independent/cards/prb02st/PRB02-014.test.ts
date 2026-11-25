/**
 * PRB02-014 Sabo (Character, cost 6, 6000, Counter +2000, {Revolutionary Army}/{Dressrosa},
 * [Blocker]).
 *
 * Card text: "If you have 15 or more cards in your trash, give this card in your hand -3 cost.
 * [Blocker]"
 *
 * Rules: a permanent effect that works in the hand (CR 8-1-3-3); the cost is recomputed as the trash
 * changes. Only YOUR trash counts. The reduction is -3 (not more with a bigger trash), only while the
 * card is in the hand; once on the field its cost is the printed 6.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  blockers,
  canPlayCard,
  chr,
  donStr,
  gammaKnife,
  kw,
  LDP,
  mine,
  need,
  playRaw,
  SP,
  sorted,
  theirs,
  act,
} from './kit-prb02sta.ts';

const SA = 'PRB02-014';
const trashN = (n: number) => Array.from({ length: n }, () => SP.mohji);

function board(trashCount: number, active = 10, extra: Record<string, unknown> = {}) {
  return mine(LDP.neutral, {
    hand: [SA],
    trash: trashN(trashCount),
    costArea: { active, rested: 0 },
    ...extra,
  });
}

const handCost = (g: ReturnType<typeof board>) => g.card(g.find('p1', 'hand', SA)).cost;

describe('PRB02-014 Sabo: if 15+ cards in trash, costs 3 less in hand; [Blocker]', () => {
  it('printed values on the field: cost 6, 6000 power, Counter +2000, [Blocker]', () => {
    const g = mine(LDP.neutral, { characters: [SA] });
    const i = at(g, 'p1', 'characters', SA);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([6, 6000, 2000]);
    expect(kw(g, i)).toContain('Blocker');
  });

  it('14 cards in the trash: the cost in hand is the printed 6', () => {
    expect(handCost(board(14))).toBe(6);
  });

  it('exactly 15 cards in the trash: the cost in hand is 3', () => {
    expect(handCost(board(15))).toBe(3);
  });

  it('20 cards in the trash: still only -3 (cost 3)', () => {
    expect(handCost(board(20))).toBe(3);
  });

  it('with 3 active DON!! Sabo can be played at 15 trash but not at 14', () => {
    expect(canPlayCard(board(15, 3), board(15, 3).find('p1', 'hand', SA))).toBe(true);
    const g14 = board(14, 3);
    expect(canPlayCard(g14, g14.find('p1', 'hand', SA))).toBe(false);
  });

  it('playing it at 15 trash costs exactly 3 DON!!', () => {
    const g = board(15, 5);
    playRaw(g, SA);
    expect(donStr(g, 'p1')).toBe('2/3/0');
    expect(sorted(g, 'p1', 'characters')).toEqual([SA]);
  });

  it('once on the field its cost is back to 6, whatever the trash holds', () => {
    const g = board(15, 5);
    playRaw(g, SA);
    expect(g.card(at(g, 'p1', 'characters', SA)).cost).toBe(6);
  });

  it('the reduction follows the trash during the turn: an Event played from hand brings 14 to 15 and Sabo drops from 6 to 3', () => {
    const g = mine(
      LDP.neutral,
      { hand: [SA, SP.gammaKnife], trash: trashN(14), costArea: { active: 10, rested: 0 } },
      { characters: [SP.c1p3] },
    );
    expect(g.card(g.find('p1', 'hand', SA)).cost).toBe(6);
    gammaKnife(g, chr(g, 'p2', SP.c1p3));
    expect(g.zone('p1', 'trash')).toHaveLength(15);
    expect(g.card(g.find('p1', 'hand', SA)).cost).toBe(3);
  });

  it("only my own trash counts: 15 cards in the OPPONENT's trash do not reduce it", () => {
    const g = mine(
      LDP.neutral,
      { hand: [SA], trash: trashN(14), costArea: { active: 10, rested: 0 } },
      { trash: trashN(15) },
    );
    expect(g.card(g.find('p1', 'hand', SA)).cost).toBe(6);
  });

  it('[Blocker]: it can block an attack on my Leader', () => {
    const g = theirs(LDP.neutral, { characters: [SA] });
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', SA)]);
  });
});
