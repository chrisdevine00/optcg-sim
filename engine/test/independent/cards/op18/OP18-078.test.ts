/**
 * OP18-078 Mini-Merry (Stage, Purple, cost 5, type Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[On Play] Draw 1 card, then add up to 1 DON!! card as rested from your DON!! deck.
 *    [Activate: Main] You may rest this Stage: Give up to a total of 4 of your Leader or Characters
 *    1 rested DON!! Card each."
 *
 * Rules: "give DON!!" (CR 6-5-5?) moves a DON!! from the cost area to a Leader/Character; "rested
 * DON!!" means it takes DON!! from the rested ones in the cost area; "1 each" means at most one per
 * target; "up to a total of 4" CR 8-4-4-1.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, play, takeMost } from '../../helpers.ts';
import {
  activate,
  canActivate,
  canFinish,
  choiceCards,
  choices,
  chooseNone,
  count,
  donOf,
  kind,
  LEAD,
  myTurn,
  PURPLE,
  RED,
  settleYes,
  side,
  sortedIds,
  VAN,
} from '../kit.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { queries } from '@optcg/engine';

const MERRY = 'OP18-078';

function onField(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return myTurn(
    side(LEAD.kaido, PURPLE, {
      stage: MERRY,
      characters: [VAN.marco, VAN.sai, VAN.hajrudin, VAN.kingdew],
      costArea: { active: 0, rested: 5 },
      ...p1,
    }),
    side(LEAD.luffy, RED, { characters: [VAN.thatch], ...p2 }),
  );
}

const stageOf = (g: TestGame) => g.find('p1', 'stage', MERRY);

/** Pick the targets in the order the engine offers them (unordered picks are canonical, ARCHITECTURE §2.3). */
function giveTo(g: TestGame, targets: string[]): void {
  const want = new Set(targets);
  while (kind(g) === 'choose') {
    const next = choices(g).find((c) => want.has(c));
    if (!next) break;
    want.delete(next);
    act(g, { type: 'pick', choice: next });
  }
  if (kind(g) === 'choose' && canFinish(g)) act(g, { type: 'done' });
}

const given = (g: TestGame, card: string) => queries.card(g.state, card).don;

describe('OP18-078 Mini-Merry: [On Play] draw 1, then add up to 1 rested DON!!', () => {
  it('playing it draws the top card and adds 1 rested DON!!', () => {
    const g = myTurn(
      side(LEAD.kaido, PURPLE, {
        hand: [MERRY],
        deck: [VAN.marco, ...Array(10).fill(PURPLE)],
        costArea: { active: 5, rested: 0 },
      }),
      side(LEAD.luffy, RED),
    );
    play(g, g.find('p1', 'hand', MERRY));
    takeMost(g);
    settleYes(g, 'p1');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.marco]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 6, deck: 4 });
    expect(kind(g)).toBe('main');
  });
});

describe('OP18-078 Mini-Merry: [Activate: Main] rest it → give up to 4 of your Leader/Characters 1 rested DON!! each', () => {
  it('happy path: 4 targets each get 1 rested DON!!; the Stage rests', () => {
    const g = onField();
    activate(g, stageOf(g));
    const targets = [
      g.leader('p1'),
      g.find('p1', 'characters', VAN.marco),
      g.find('p1', 'characters', VAN.sai),
      g.find('p1', 'characters', VAN.hajrudin),
    ];
    giveTo(g, targets);
    for (const t of targets) expect(given(g, t)).toBe(1);
    expect(given(g, g.find('p1', 'characters', VAN.kingdew))).toBe(0);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 1, given: 4 });
    expect(g.card(stageOf(g)).rested).toBe(true);
  });

  it('a Leader and Characters are all valid targets; the opponent’s Characters are not', () => {
    const g = onField();
    activate(g, stageOf(g));
    const offeredCards = choiceCards(g);
    expect(offeredCards).toContain(LEAD.kaido);
    expect(offeredCards).toContain(VAN.marco);
    expect(offeredCards).not.toContain(VAN.thatch);
    chooseNone(g);
  });

  it('"up to a total of 4": with 5 candidates and plenty of rested DON!!, no fifth target can be chosen', () => {
    const g = onField({ costArea: { active: 0, rested: 8 } });
    activate(g, stageOf(g));
    const all = [g.leader('p1'), ...g.zone('p1', 'characters').map((c) => c.instance)];
    giveTo(g, all.slice(0, 4));
    expect(given(g, all[4]!)).toBe(0);
    expect(donOf(g, 'p1').given).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('"1 each": a single target is never given 2 DON!! by one activation', () => {
    const g = onField({ costArea: { active: 0, rested: 5 } });
    activate(g, stageOf(g));
    const marco = g.find('p1', 'characters', VAN.marco);
    g.act({ type: 'pick', choice: marco });
    expect(g.legal().some((a) => a.type === 'pick' && a.choice === marco)).toBe(false);
  });

  it('fewer targets than 4 is allowed ("up to"): 2 targets get 2 DON!!', () => {
    const g = onField();
    activate(g, stageOf(g));
    giveTo(g, [g.leader('p1'), g.find('p1', 'characters', VAN.kingdew)]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 3, given: 2 });
  });

  it('choosing no target is allowed; the Stage is still rested', () => {
    const g = onField();
    activate(g, stageOf(g));
    chooseNone(g);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 5, given: 0 });
    expect(g.card(stageOf(g)).rested).toBe(true);
  });

  it('only RESTED DON!! can be given: with only active DON!! nothing is given', () => {
    const g = onField({ costArea: { active: 4, rested: 0 } });
    if (canActivate(g, stageOf(g))) {
      activate(g, stageOf(g));
      if (kind(g) === 'choose') chooseNone(g);
    }
    expect(donOf(g, 'p1').given).toBe(0);
    expect(donOf(g, 'p1').active).toBe(4);
  });

  it('with only 2 rested DON!! (and 2 active) at most 2 targets get one', () => {
    const g = onField({ costArea: { active: 2, rested: 2 } });
    activate(g, stageOf(g));
    const all = [g.leader('p1'), ...g.zone('p1', 'characters').map((c) => c.instance)];
    giveTo(g, all.slice(0, 4));
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 0, given: 2 });
  });

  it('a rested Stage cannot pay the rest cost: it cannot be activated', () => {
    const g = onField({ stage: { card: MERRY, rested: true } });
    expect(canActivate(g, stageOf(g))).toBe(false);
  });

  it('given DON!! is attached and counts toward the DON!! on your field', () => {
    const g = onField();
    const before = donOf(g, 'p1');
    activate(g, stageOf(g));
    giveTo(g, [g.leader('p1')]);
    const after = donOf(g, 'p1');
    expect(after.active + after.rested + after.given).toBe(
      before.active + before.rested + before.given,
    );
    expect(count(g, 'p1', 'stage')).toBe(1);
    expect(kind(g)).toBe('main');
  });
});
