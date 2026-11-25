/**
 * OP09-074 Bepo (Character, Purple, cost 2, 2000, Counter +2000, {Heart Pirates}/{Minks}).
 *
 * Card text: "[Your Turn] [Once Per Turn] When a DON!! card on your field is returned to your DON!!
 * deck, up to 1 of your Leader or Character cards gains +1000 power during this turn."
 *
 * Rules: CR 10-2-13 ([Once Per Turn]), CR 10-2-11 ([Your Turn]), CR 10-2-10 (DON!! −X returns DON!!
 * from the field to the DON!! deck, paying a cost counts), CR 8-4-4 ("up to"), "during this turn"
 * ends in the End Phase (CR 6-6-1-3). A DON!! −2 is one return of 2 DON!! (RL for OP02-071).
 * DON!! sources used: OP09-064 Killer (DON!! −1) and OP09-077 Gum-Gum Lightning (DON!! −2).
 * Which of Bepo's pick and the source's own pick is asked first is not asserted.
 */
import { describe, expect, it } from 'vitest';
import { act, decision, endTurn } from '../../helpers.ts';
import {
  at,
  atMain,
  donSum,
  kind,
  L9,
  mine,
  need,
  no,
  payDonStrict,
  playId,
  theirs,
  V9,
  yes,
} from './kit-op09b.ts';
import type { InstanceId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';

const BEPO = 'OP09-074';
const KILLER = 'OP09-064';
const LIGHTNING = 'OP09-077';

/**
 * Answer, for p1, whatever source prompts follow a DON!! return: Bepo's pick takes `bepo` (`null`
 * chooses nothing), Lightning's K.O. pick chooses nothing, Killer's Leader pick takes the Leader.
 * Each prompt is identified by its source card, so a wrong prompt fails the test.
 */
function settle(g: TestGame, bepo: InstanceId | null): void {
  for (let i = 0; i < 4; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose' || d.player !== 'p1') return;
    const src = d.source?.card;
    if (src === BEPO) {
      if (bepo) act(g, { type: 'pick', choice: bepo });
      else act(g, { type: 'done' });
    } else if (src === LIGHTNING) {
      act(g, { type: 'done' });
    } else if (src === KILLER) {
      act(g, { type: 'pick', choice: g.leader('p1') });
    } else {
      throw new Error(`Unexpected prompt from ${src}: ${d.prompt}`);
    }
  }
}

function killer(g: TestGame, bepo: InstanceId | null): void {
  playId(g, KILLER);
  yes(g, 'p1');
  payDonStrict(g, 1, 'costActive');
  settle(g, bepo);
}

function lightning(g: TestGame, bepo: InstanceId | null): void {
  playId(g, LIGHTNING);
  yes(g, 'p1');
  payDonStrict(g, 2, 'costActive');
  settle(g, bepo);
}

const board = (hand: string[]) =>
  mine(
    { card: L9.kid, rested: true },
    { hand, characters: [BEPO, V9.c4] },
    { characters: [V9.c1] },
  );

describe('OP09-074 Bepo: [Your Turn] [Once Per Turn] when my DON!! is returned to the DON!! deck, up to 1 of my Leader or Characters gains +1000 power this turn', () => {
  it("paying Killer's DON!! −1 triggers Bepo: the Leader I pick has +1000 power", () => {
    const g = board([KILLER]);
    const base = g.power(g.leader('p1'));
    killer(g, g.leader('p1'));
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(base! + 1000);
  });

  it('the pick may be a Character: only that Character gains the power', () => {
    const g = board([KILLER]);
    const kingdew = at(g, 'p1', 'characters', V9.c4);
    const base = g.power(kingdew);
    const leaderBase = g.power(g.leader('p1'));
    killer(g, kingdew);
    expect(g.power(kingdew)).toBe(base! + 1000);
    expect(g.power(g.leader('p1'))).toBe(leaderBase);
  });

  it('Bepo itself may be the pick', () => {
    const g = board([KILLER]);
    const bepo = at(g, 'p1', 'characters', BEPO);
    const base = g.power(bepo);
    killer(g, bepo);
    expect(g.power(bepo)).toBe(base! + 1000);
  });

  it('"up to 1": choosing nothing gives nobody power', () => {
    const g = board([KILLER]);
    const base = g.power(g.leader('p1'));
    killer(g, null);
    expect(g.power(g.leader('p1'))).toBe(base);
    expect(g.power(at(g, 'p1', 'characters', BEPO))).toBe(2000);
  });

  it('a DON!! −2 (one return of 2 DON!!) gives +1000 once, not +2000', () => {
    const g = board([LIGHTNING]);
    const base = g.power(g.leader('p1'));
    lightning(g, g.leader('p1'));
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(base! + 1000);
  });

  it('[Once Per Turn]: a second DON!! return in the same turn does not trigger Bepo again', () => {
    const g = board([KILLER, LIGHTNING]);
    const base = g.power(g.leader('p1'));
    killer(g, g.leader('p1'));
    playId(g, LIGHTNING);
    yes(g, 'p1');
    payDonStrict(g, 2, 'costActive');
    // No Bepo prompt may appear: only Lightning's own K.O. pick (answered with nothing).
    const d = decision(g);
    if (d?.kind === 'choose') {
      expect(d.source?.card).toBe(LIGHTNING);
      act(g, { type: 'done' });
    }
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(base! + 1000);
  });

  it('declining the DON!! cost returns no DON!!, so Bepo does not trigger', () => {
    const g = board([KILLER]);
    const base = g.power(g.leader('p1'));
    playId(g, KILLER);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(base);
    expect(donSum(g, 'p1').active + donSum(g, 'p1').rested).toBe(10);
  });

  it('with no DON!! returned, nothing triggers: resting DON!! to play a card asks no Bepo question', () => {
    const g = board([V9.c2]);
    playId(g, V9.c2);
    expect(atMain(g)).toBe(true);
    need(g, 'main', 'p1');
  });

  it('"during this turn": the +1000 is gone once the turn has ended', () => {
    const g = board([KILLER]);
    const base = g.power(g.leader('p1'));
    killer(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(base! + 1000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(base);
  });

  it("must not trigger for the opponent's DON!! being returned: p2's own DON!! −1 on p2's turn asks p1 nothing", () => {
    const g = theirs(L9.neutral, { characters: [BEPO] }, { hand: [KILLER] });
    playId(g, KILLER, 'p2');
    // Only p2 owes decisions here; p1 is never asked about Bepo.
    expect(decision(g)?.player).toBe('p2');
    yes(g, 'p2');
    payDonStrict(g, 1, 'costActive');
    expect(decision(g)?.player === 'p1' && kind(g) === 'choose').toBe(false);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
