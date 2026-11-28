/**
 * OP18-064 Saint Killingham (Character, Purple, cost 5, 6000, Counter +1000, {Celestial Dragons}/
 * {Holy Knights of God}).
 *
 * Card text (cards/data):
 *   "[Your Turn] [On Play] DON!! −1: Up to 1 of your opponent's Characters with 7000 base power or
 *    less and up to 1 of your opponent's Characters with 5000 base power or less cannot attack
 *    until the end of your opponent's next End Phase.
 *    [On K.O.] DON!! −1: Play this Character card from your trash."
 *
 * Rules: DON!! −1 returns 1 DON!! (active or rested) to the DON!! deck as a cost (CR 8-3-1-6); the
 * two "up to 1" picks are independent and are two different Characters (M6b-Q11); the restriction
 * lasts until the end of the opponent's next End Phase. "[Your Turn]" means the [On Play] works only
 * when played on my own turn. The [On K.O.] replays this card from the trash, paying DON!! −1.
 *
 * Scenery (vanilla, opposing): OP02-007 Thatch (8000), OP02-006 Kingdew (7000), OP01-018 Hajrudin
 * (6000), OP01-023 Marco (5000), OP01-012 Sai (4000).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  canAttackAnything,
  cardIds,
  CH,
  choices,
  decline,
  donOf,
  endTurn,
  kind,
  LDR,
  LEAD,
  mine,
  need,
  offered,
  RED,
  side,
  strike,
  theirTurn,
} from './kit-d.ts';

const KILL = 'OP18-064';
const THATCH = 'OP02-007';
const KINGDEW = 'OP02-006';
const HAJ = 'OP01-018';
const MARCO = 'OP01-023';
const SAI = 'OP01-012';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return mine(
    LEAD.kaido,
    { hand: [KILL], costArea: { active: 6, rested: 0 }, ...p1 },
    { characters: [THATCH, KINGDEW, HAJ, MARCO, SAI], ...p2 },
  );
}

/** Play, accept the DON!! −1 cost and pay it from an active DON!!. Stops at the first target pick. */
function start(g: TestGame) {
  play(g, g.find('p1', 'hand', KILL));
  need(g, 'optional', 'p1');
  accept(g);
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: { from: 'costActive' } });
}

const p2c = (g: TestGame, card: string) => g.find('p2', 'characters', card);

function toOpponent(g: TestGame) {
  endTurn(g);
  need(g, 'main', 'p2');
}

describe('OP18-064 Saint Killingham: [Your Turn] [On Play] DON!! −1: two opposing Characters (7000 / 5000 base power or less) cannot attack', () => {
  it('both chosen Characters cannot attack on the opponent’s next turn; the others can', () => {
    const g = game();
    start(g);
    act(g, { type: 'pick', choice: p2c(g, KINGDEW) });
    act(g, { type: 'pick', choice: p2c(g, MARCO) });
    expect(kind(g)).toBe('main');
    expect(donOf(g, 'p1')).toMatchObject({ deck: 5 });
    toOpponent(g);
    expect(canAttackAnything(g, p2c(g, KINGDEW))).toBe(false);
    expect(canAttackAnything(g, p2c(g, MARCO))).toBe(false);
    expect(canAttackAnything(g, p2c(g, THATCH))).toBe(true);
    expect(canAttackAnything(g, p2c(g, HAJ))).toBe(true);
    expect(canAttackAnything(g, p2c(g, SAI))).toBe(true);
  });

  it('first pick boundary: 7000 and 6000 are offered, 8000 is not', () => {
    const g = game();
    start(g);
    const first = choices(g);
    expect(first).toContain(p2c(g, KINGDEW));
    expect(first).toContain(p2c(g, HAJ));
    expect(first).not.toContain(p2c(g, THATCH));
  });

  it('second pick boundary: 5000 and 4000 are offered, 6000 and 7000 are not', () => {
    const g = game();
    start(g);
    act(g, { type: 'pick', choice: p2c(g, SAI) });
    const second = choices(g);
    expect(second).toContain(p2c(g, MARCO));
    expect(second).not.toContain(p2c(g, HAJ));
    expect(second).not.toContain(p2c(g, KINGDEW));
    expect(second).not.toContain(p2c(g, SAI));
  });

  it('each "up to 1" may be skipped: skipping both restricts nobody (the DON!! −1 is still paid)', () => {
    const g = game();
    start(g);
    act(g, { type: 'done' });
    act(g, { type: 'done' });
    expect(donOf(g, 'p1').deck).toBe(5);
    toOpponent(g);
    expect(canAttackAnything(g, p2c(g, KINGDEW))).toBe(true);
    expect(canAttackAnything(g, p2c(g, SAI))).toBe(true);
  });

  it('"until the end of your opponent’s next End Phase": a restricted Character attacks again one turn later', () => {
    const g = game();
    start(g);
    act(g, { type: 'pick', choice: p2c(g, KINGDEW) });
    act(g, { type: 'done' });
    toOpponent(g);
    expect(canAttackAnything(g, p2c(g, KINGDEW))).toBe(false);
    endTurn(g);
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, p2c(g, KINGDEW))).toBe(true);
  });

  it('declining the DON!! −1: nothing is chosen and no DON!! returns', () => {
    const g = game();
    play(g, g.find('p1', 'hand', KILL));
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(donOf(g, 'p1')).toMatchObject({ deck: 4, rested: 5 });
    toOpponent(g);
    expect(canAttackAnything(g, p2c(g, KINGDEW))).toBe(true);
  });
});

describe('OP18-064 Saint Killingham: [On K.O.] DON!! −1: play this Character from the trash', () => {
  /** p2's turn: p2's Thatch (8000) attacks p1's rested Killingham (6000). p1 has 2 active DON!!. */
  function attacked(p1: Partial<PlayerSpec> = {}): TestGame {
    const g = theirTurn(
      side(LDR.luffy, RED, {
        characters: [{ card: KILL, rested: true }],
        costArea: { active: 2, rested: 0 },
        ...p1,
      }),
      side(LDR.luffy, RED, { characters: [CH.thatch6] }),
    );
    strike(g, g.find('p2', 'characters', CH.thatch6), g.find('p1', 'characters', KILL));
    return g;
  }

  it('K.O.’d in battle: paying DON!! −1 plays it again from the trash', () => {
    const g = attacked();
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: { from: 'costActive' } });
    expect(cardIds(g, 'p1', 'characters')).toEqual([KILL]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, deck: 9 });
  });

  it('declining: it stays in the trash and no DON!! is returned', () => {
    const g = attacked();
    decline(g);
    expect(cardIds(g, 'p1', 'trash')).toEqual([KILL]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2 });
  });

  it('with no DON!! on the field the cost cannot be paid: it stays in the trash', () => {
    const g = attacked({ costArea: { active: 0, rested: 0 } });
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'trash')).toEqual([KILL]);
  });

  it('"[Your Turn]": replayed on the opponent’s turn its [On Play] does nothing (no restriction picks)', () => {
    const g = attacked();
    accept(g);
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: { from: 'costActive' } });
    expect(kind(g)).toBe('main');
    expect(g.decider).toBe('p2');
  });
});
