/**
 * OP15-019 Barrier Bulls (Event, Red, cost 3, {Dressrosa}/{Barto Club}).
 *
 * Card text: "[Main] Draw 1 card and your Leader gains +1000 power until the end of your opponent's
 * next End Phase. [Trigger] Give up to 1 of your opponent's Characters -4000 power during this
 * turn."
 *
 * Rules: CR 10-1-5 ([Trigger]: the printed cost is not paid, the card is trashed after), CR 8-4-2
 * (durations), CR 8-4-4-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from './kit-op15a.ts';
import {
  activateTrigger,
  at,
  chr,
  choices,
  declineTrigger,
  deck,
  don,
  hand,
  hitLeader,
  kind,
  LD15,
  leaderPower,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SCN,
  theirs,
  trash,
  BLUE,
  RED,
  side,
  theirTurn,
} from './kit-op15a.ts';

const BULLS = 'OP15-019';

describe('OP15-019 Barrier Bulls: [Main] draw 1 and Leader +1000 until the end of the opponent next End Phase', () => {
  it('draws exactly 1 card, costs 3 DON!! and the Event goes to the trash', () => {
    const g = mine(LD15.luffy, { hand: [BULLS] });
    const before = deck(g).length;
    playRaw(g, BULLS);
    need(g, 'main', 'p1');
    expect(hand(g)).toHaveLength(1);
    expect(deck(g)).toHaveLength(before - 1);
    expect(trash(g)).toEqual([BULLS]);
    expect(don(g, 'p1')).toMatchObject({ active: 7, rested: 3 });
  });

  it('my Leader gains +1000 power at once (6000)', () => {
    const g = mine(LD15.luffy, { hand: [BULLS] });
    expect(leaderPower(g, 'p1')).toBe(5000);
    playRaw(g, BULLS);
    expect(leaderPower(g, 'p1')).toBe(6000);
  });

  it("the bonus is still there during the opponent's turn", () => {
    const g = mine(LD15.luffy, { hand: [BULLS] });
    playRaw(g, BULLS);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(leaderPower(g, 'p1')).toBe(6000);
  });

  it("it ends with the opponent's End Phase: 5000 again in my next turn", () => {
    const g = mine(LD15.luffy, { hand: [BULLS] });
    playRaw(g, BULLS);
    endTurn(g);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(leaderPower(g, 'p1')).toBe(5000);
  });

  it('the bonus is for my Leader only: my Characters and the opposing Leader are unchanged', () => {
    const g = mine(LD15.luffy, { hand: [BULLS], characters: [SCN.c3] }, { characters: [SCN.c3] });
    playRaw(g, BULLS);
    expect(g.power(at(g, 'p1', 'characters', SCN.c3))).toBe(5000);
    expect(leaderPower(g, 'p2')).toBe(5000);
    expect(g.power(chr(g, 'p2', SCN.c3))).toBe(5000);
  });

  it('a played Barrier Bulls cannot be played with fewer than 3 active DON!!', () => {
    const g = mine(LD15.luffy, { hand: [BULLS], costArea: { active: 2, rested: 0 } });
    expect(g.legal().some((a) => a.type === 'playCard')).toBe(false);
  });
});

/** p2's Leader hits my Leader; the top Life card is Barrier Bulls, with p2 Characters on the field. */
function trigger(p2chars: string[] = [SCN.c3, SCN.c5]) {
  const g = theirTurn(
    side(LD15.luffy, BLUE, {
      life: [BULLS, BLUE, BLUE, BLUE],
      hand: [BLUE],
      costArea: { active: 0, rested: 0 },
    }),
    side(LD15.luffy, RED, { characters: p2chars, costArea: { active: 10, rested: 0 } }),
  );
  hitLeader(g);
  return g;
}

describe('OP15-019 Barrier Bulls: [Trigger] up to 1 opposing Character -4000 power this turn', () => {
  it('activating it offers only the opposing Characters and applies -4000 to the chosen one', () => {
    const g = trigger();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c5].sort());
    pickInst(g, [chr(g, 'p2', SCN.c5)]);
    expect(g.power(chr(g, 'p2', SCN.c5))).toBe(3000);
    expect(g.power(chr(g, 'p2', SCN.c3))).toBe(5000);
  });

  it('"up to": choosing nothing changes nothing', () => {
    const g = trigger();
    activateTrigger(g);
    none(g);
    expect(g.power(chr(g, 'p2', SCN.c5))).toBe(7000);
  });

  it('the Trigger does not draw and does not boost my Leader (that is the [Main] only)', () => {
    const g = trigger();
    activateTrigger(g);
    pickInst(g, [chr(g, 'p2', SCN.c3)]);
    expect(hand(g)).toEqual([BLUE]);
    expect(leaderPower(g, 'p1')).toBe(5000);
    expect(trash(g)).toEqual([BULLS]);
  });

  it('the -4000 ends with the turn', () => {
    const g = trigger();
    activateTrigger(g);
    pickInst(g, [chr(g, 'p2', SCN.c5)]);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p2', SCN.c5))).toBe(3000);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p2', SCN.c5))).toBe(7000);
  });

  it('declining the Trigger: the card goes to my hand and nothing is reduced', () => {
    const g = trigger();
    declineTrigger(g);
    expect(hand(g).sort()).toEqual([BLUE, BULLS].sort());
    expect(g.power(chr(g, 'p2', SCN.c5))).toBe(7000);
  });

  it('with no opposing Characters the Trigger resolves with nothing to choose', () => {
    const g = trigger([]);
    activateTrigger(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    need(g, 'main', 'p2');
    expect(trash(g)).toEqual([BULLS]);
  });
});

void theirs;
