/**
 * OP14-114 Ran (Character, Yellow, cost 4, 5000, Counter +1000; Kuja Pirates).
 *
 * Card text:
 *   "[Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to 1 of your {Kuja Pirates} type
 *    Leader or Character cards.
 *    [Trigger] If your Leader has the {Kuja Pirates} type, play this card."
 *
 * Rules: DON!! given from the cost area must be RESTED ones (CR 6-5-5-2 / "rested DON!! card");
 * given DON!! show on the card (`CardView.don`); CR 10-2-13 once per turn; the type test is the
 * {Kuja Pirates} type only (an Amazon Lily Character without it is not a target).
 * Scenery: OP07-038 Leader (Kuja), OP16-112 Boa Hancock (Kuja, 8000), OP08-048 Sweetpea (Amazon Lily
 * only), OP01-018 Hajrudin (neither), ST06-001 Leader (Navy).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  activate,
  activateTrigger,
  BLUE,
  canActivate,
  choiceCards,
  choose,
  decider,
  donOf,
  hitLeader,
  kind,
  LD,
  LEAD,
  myTurn,
  RED,
  rep,
  side,
  sortedIds,
  theirTurn,
  V,
  VAN,
} from './kit-d.ts';

const RAN = 'OP14-114';

function game(leader: string, p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(leader, BLUE, {
      characters: [RAN, V.kuja8, V.sweetpea, VAN.hajrudin],
      costArea: { active: 2, rested: 2 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
}

describe('OP14-114 Ran [Activate: Main]: give up to 1 rested DON!! to a Kuja Pirates Leader or Character', () => {
  it('targets: the Kuja Leader and Kuja Characters (Ran herself, Boa Hancock); Amazon Lily-only and others are not', () => {
    const g = game(LD.kuja);
    activate(g, g.find('p1', 'characters', RAN));
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    const cards = offered.map((i) => g.card(i).card).sort();
    expect(cards).toEqual([LD.kuja, RAN, V.kuja8].sort());
  });

  it('giving to a Character: one rested DON!! moves onto it, active DON!! are untouched', () => {
    const g = game(LD.kuja);
    activate(g, g.find('p1', 'characters', RAN));
    choose(g, [g.find('p1', 'characters', V.kuja8)]);
    expect(g.card(g.find('p1', 'characters', V.kuja8)).don).toBe(1);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1, given: 1 });
    expect(g.power(g.find('p1', 'characters', V.kuja8))).toBe(9000);
  });

  it('giving to the Leader works', () => {
    const g = game(LD.kuja);
    activate(g, g.find('p1', 'characters', RAN));
    choose(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 1, given: 1 });
  });

  it('a Leader without the Kuja Pirates type is not a target', () => {
    const g = game(LD.navy);
    activate(g, g.find('p1', 'characters', RAN));
    const cards = choiceCards(g);
    expect(cards).not.toContain(LD.navy);
    expect(cards).toEqual([RAN, V.kuja8].sort());
  });

  it('only 1 DON!! is given (never 2) and only a rested one: with 0 rested DON!! nothing moves', () => {
    const g = game(LD.kuja, { costArea: { active: 3, rested: 0 } });
    if (canActivate(g, g.find('p1', 'characters', RAN))) {
      activate(g, g.find('p1', 'characters', RAN));
      if (kind(g) === 'choose') {
        const done = g.legal().find((a) => a.type === 'done');
        if (done) g.act(done);
      }
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0, given: 0 });
  });

  // DISAGREEMENTS-d.md, entry 2: "up to 1" allows giving no DON!! (CR 8-4-4-1).
  it('CR 8-4-4-1: "up to 1" allows giving no DON!! even with rested DON!! available', () => {
    const g = game(LD.kuja);
    activate(g, g.find('p1', 'characters', RAN));
    expect(g.legal().some((a) => a.type === 'done')).toBe(true);
  });

  it('CR 10-2-13: [Once Per Turn]: not offered a second time', () => {
    const g = game(LD.kuja);
    activate(g, g.find('p1', 'characters', RAN));
    choose(g, [g.leader('p1')]);
    expect(kind(g)).toBe('main');
    expect(canActivate(g, g.find('p1', 'characters', RAN))).toBe(false);
    expect(donOf(g, 'p1').given).toBe(1);
  });
});

describe('OP14-114 Ran [Trigger]: play this card if your Leader has the Kuja Pirates type', () => {
  function trig(leader: string) {
    const g = theirTurn(
      side(leader, BLUE, { life: [RAN, ...rep(BLUE, 3)] }),
      side(LEAD.luffy, RED),
    );
    hitLeader(g);
    activateTrigger(g);
    return g;
  }

  it('Kuja Leader: Ran is played', () => {
    const g = trig(LD.kuja);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([RAN]);
    expect(decider(g)).toBe('p2');
  });

  it('CR 4-10-1: a Leader without the type: not played', () => {
    const g = trig(LD.navy);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([RAN]);
  });
});
