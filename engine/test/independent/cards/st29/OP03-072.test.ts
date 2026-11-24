/**
 * OP03-072 Gum-Gum Jet Gatling (Event, Purple, cost 0, {Straw Hat Crew}/{Water Seven}).
 *
 * Card text: "[Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Character cards
 * gains +3000 power during this battle.
 * [Trigger] Add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules: [Counter] (CR 10-2-4) as in the other cost-0 trash Counters. [Trigger] (CR 10-1-5): "add up
 * to N DON!!" asks a count (most first); the DON!! enters the cost area ACTIVE; with an empty DON!!
 * deck nothing can be added.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  C29,
  declineTrigger,
  describeTrashCounter,
  don,
  fill,
  hand,
  hitLeader,
  ids29,
  isMain,
  kind,
  L29,
  need,
  theirs,
} from './kit-st29a.ts';
import { decision } from '../../helpers.ts';

const ID = 'OP03-072';

describeTrashCounter({ id: ID });

describe('OP03-072 Gum-Gum Jet Gatling [Trigger] add up to 1 DON!! from the DON!! deck, active', () => {
  const hit = (o: { active: number; rested: number; donDeck?: number }) => {
    const g = theirs(
      L29.croc,
      {
        life: [ID, ...fill(C29.c1, 3)],
        costArea: { active: o.active, rested: o.rested },
        donDeck: o.donDeck,
      },
      {},
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  };

  /** Answer the count question (an "up to 1" DON!! add) with `n` if it is asked. */
  const answerCount = (g: ReturnType<typeof hit>, n: number) => {
    if (kind(g) !== 'choose') return false;
    expect(decision(g)?.purpose).toBe('mode');
    g.act({ type: 'pick', choice: { option: String(n) }, player: 'p1' });
    return true;
  };

  it('activating adds 1 DON!! that is ACTIVE (not rested): cost area 3 active + 1 new active', () => {
    const g = hit({ active: 3, rested: 0 });
    activateTrigger(g);
    answerCount(g, 1);
    expect(don(g)).toMatchObject({ active: 4, rested: 0 });
    expect(don(g).deck).toBe(10 - 3 - 1);
    expect(ids29(g, 'p1', 'trash')).toEqual([ID]);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('"up to 1": the player is asked a count (0 or 1); answering 0 adds nothing', () => {
    const g = hit({ active: 3, rested: 0 });
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect((decision(g)?.options ?? []).map((o) => o.id).sort()).toEqual(['0', '1']);
    answerCount(g, 0);
    expect(don(g)).toMatchObject({ active: 3, rested: 0 });
  });

  it('the DON!! card comes from the DON!! deck: the DON!! deck shrinks by exactly 1', () => {
    const g = hit({ active: 2, rested: 2 });
    const before = don(g).deck;
    activateTrigger(g);
    answerCount(g, 1);
    expect(don(g).deck).toBe(before - 1);
    expect(don(g)).toMatchObject({ active: 3, rested: 2 });
  });

  it('with an empty DON!! deck (10 DON!! already in the cost area) nothing is added', () => {
    const g = hit({ active: 5, rested: 5, donDeck: 0 });
    activateTrigger(g);
    if (kind(g) === 'choose') answerCount(g, 0);
    expect(don(g)).toMatchObject({ active: 5, rested: 5, deck: 0 });
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('declining the [Trigger] adds the Event to my hand and adds no DON!!', () => {
    const g = hit({ active: 3, rested: 0 });
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(don(g)).toMatchObject({ active: 3, rested: 0 });
  });
});
