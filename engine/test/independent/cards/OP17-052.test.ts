/**
 * OP17-052 Don Marlon (Character, Blue, cost 3, 5000, no Counter, type Rocks Pirates).
 *
 * Card text (cards/data):
 *   "[On Play] Add up to 1 blue Event with a cost of 0 from your trash to your hand."
 *
 * Trash contents used: OP17-055 and OP17-056 (blue Events, cost 0: valid); EB01-029 "Sorry. I'm a
 * Goner." (blue Event, cost 1: wrong cost); OP15-078 Mamaragan (purple Event, cost 0: wrong
 * color); OP02-060 Mohji (blue Character, cost 1: not an Event).
 * Rules: "up to 1" allows 0 (CR 8-4-4-1); with no valid card nothing happens (QA-GR "target is not
 * present").
 */
import { describe, expect, it } from 'vitest';
import { decision, play } from '../helpers.ts';
import {
  AKP,
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  LEAD,
  myTurn,
  RED,
  ROCKS,
  side,
  sortedIds,
  VAN,
} from './kit.ts';

const BLUE_EVENT_COST_1 = 'EB01-029';

function game(trash: string[]) {
  const g = myTurn(
    side(LEAD.rocks, BLUE, { hand: [ROCKS.marlon], trash, costArea: { active: 3, rested: 0 } }),
    side(LEAD.luffy, RED),
  );
  play(g, g.find('p1', 'hand', ROCKS.marlon));
  return g;
}

const MIXED = [ROCKS.noAuthority, ROCKS.rocksEvent, BLUE_EVENT_COST_1, AKP.mamaragan, VAN.mohji];

describe('OP17-052 Don Marlon: [On Play] a blue cost-0 Event from trash to hand', () => {
  it('target restriction: only blue Events with cost 0 are offered', () => {
    const g = game(MIXED);
    expect(choiceCards(g)).toEqual([ROCKS.noAuthority, ROCKS.rocksEvent].sort());
  });

  it('happy path: the chosen Event moves from trash to hand', () => {
    const g = game(MIXED);
    choose(g, [g.find('p1', 'trash', ROCKS.noAuthority)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([ROCKS.noAuthority]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual(
      [ROCKS.rocksEvent, BLUE_EVENT_COST_1, AKP.mamaragan, VAN.mohji].sort(),
    );
  });

  it('"up to 1": at most one card, even with two valid Events', () => {
    const g = game([ROCKS.noAuthority, ROCKS.noAuthority]);
    choose(g, [g.find('p1', 'trash', ROCKS.noAuthority, 0)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([ROCKS.noAuthority]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([ROCKS.noAuthority]);
  });

  it('CR 8-4-4-1: choosing none leaves the trash as it was', () => {
    const g = game(MIXED);
    chooseNone(g);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p1', 'trash')).toHaveLength(5);
  });

  it('with no valid card in trash, nothing is asked and the Main Phase continues', () => {
    const g = game([BLUE_EVENT_COST_1, AKP.mamaragan, VAN.mohji]);
    if (decision(g)?.kind === 'choose') expect(choiceCards(g)).toEqual([]);
    else expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });
});
