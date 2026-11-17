/**
 * OP15-035 Laboon (Character, Green, cost 1, 2000, Counter +2000; Animal).
 *
 * Card text (cards/data):
 *   "If your Character with 7000 base power or less would be removed from the field by your
 *    opponent's effect, you may rest 2 of your cards instead."
 *
 * Rules: a replacement effect (CR 8-1-3-4): "may" makes it optional; it applies only to removal by
 * an opponent's effect (not battle K.O.s, not your own effects); "base power" ignores modifiers
 * (CR 4-9-2); an impossible replacement cannot be applied (CR 8-1-3-4-5): with fewer than 2 active
 * cards of yours to rest it is not offered. Laboon can protect itself (RL-31 / QA-OP15 style).
 *
 * The opponent's effect used here is OP12-038 Rashomon ("K.O. up to 2 rested Characters with a base
 * cost of 4 or less"). DON!! are kept rested in these tests so that only cards (Leader, Characters,
 * Stage) can pay, whichever way "cards" is read.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  accept,
  act,
  CH,
  decline,
  drive,
  EV,
  F,
  kind,
  LB,
  mainEvent,
  offered,
  passBlock,
  side,
  sortedIds,
  theirTurn,
} from './kit-b.ts';

const LABOON = 'OP15-035';
/** OP16-017 LittleOars Jr.: Red, cost 4, 8000 base power, [Blocker], Whitebeard Pirates Allies. */
const OARS = 'OP16-017';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return theirTurn(
    side(LB.redShc, F.red, {
      characters: [LABOON, { card: CH.alvida, rested: true }, CH.bellamy3],
      costArea: { active: 0, rested: 3 },
      ...p1,
    }),
    side(LB.greenKid, F.green, {
      hand: [EV.rashomon],
      costArea: { active: 3, rested: 0 },
      ...p2,
    }),
  );
}

/** p2 plays Rashomon and K.O.s the given rested p1 Characters; stops at p1's next decision. */
function rashomon(g: ReturnType<typeof game>, targets: string[]) {
  mainEvent(g, g.find('p2', 'hand', EV.rashomon), {
    picks: [targets.map((t) => g.find('p1', 'characters', t))],
  });
}

describe('OP15-035 Laboon: may rest 2 of your cards instead of removal by the opponent’s effect (base power ≤7000)', () => {
  it('the replacement is offered to the owner (a 3000-base Character about to be K.O.’d by an effect)', () => {
    const g = game();
    rashomon(g, [CH.alvida]);
    expect(g.decider).toBe('p1');
    expect(offered(g, 'p1')).toBe(true);
  });

  it('accepting: the Character is not K.O.’d; 2 of your cards are rested instead', () => {
    const g = game();
    const alvida = g.find('p1', 'characters', CH.alvida);
    rashomon(g, [CH.alvida]);
    accept(g);
    drive(g, 'p1', {});
    expect(g.card(alvida).zone).toBe('characters');
    expect(sortedIds(g, 'p1', 'trash')).toEqual([]);
    const restedNow = [g.leader('p1'), ...g.zone('p1', 'characters').map((c) => c.instance)].filter(
      (i) => g.card(i).rested,
    );
    // Alvida was already rested; two more cards are now rested.
    expect(restedNow).toHaveLength(3);
  });

  it('declining: the Character is K.O.’d into the trash and nothing is rested', () => {
    const g = game();
    rashomon(g, [CH.alvida]);
    decline(g);
    drive(g, 'p1', {});
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.alvida]);
    expect(g.card(g.find('p1', 'characters', LABOON)).rested).toBe(false);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('Laboon protects itself: a rested Laboon (2000) about to be K.O.’d is saved by resting 2 other cards', () => {
    const g = game({ characters: [{ card: LABOON, rested: true }, CH.alvida, CH.bellamy3] });
    const laboon = g.find('p1', 'characters', LABOON);
    rashomon(g, [LABOON]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    drive(g, 'p1', {});
    expect(g.card(laboon).zone).toBe('characters');
  });

  it('a Character with more than 7000 base power (OP16-017 LittleOars, 8000) is not protected', () => {
    const g = game({ characters: [LABOON, { card: OARS, rested: true }, CH.bellamy3] });
    rashomon(g, [OARS]);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([OARS]);
  });

  it('CR 8-1-3-4-5: with fewer than 2 other active cards to rest, the replacement cannot be applied', () => {
    const g = game({
      characters: [
        { card: LABOON, rested: true },
        { card: CH.alvida, rested: true },
      ],
      leader: { card: LB.redShc, rested: true },
    });
    rashomon(g, [CH.alvida]);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.alvida]);
  });

  it('only the opponent’s effects: a battle K.O. is not replaced (a rested 3000 Character attacked by a 7000 attacker)', () => {
    const g = game({}, { characters: [CH.kingdew], hand: [] });
    const alvida = g.find('p1', 'characters', CH.alvida);
    act(g, { type: 'attack', attacker: g.find('p2', 'characters', CH.kingdew), target: alvida });
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.alvida]);
  });
});
