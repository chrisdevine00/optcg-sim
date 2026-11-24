/**
 * OP13-099 The Empty Throne (Stage, Black, cost 7, {Mary Geoise}).
 *
 * Card text: "[Your Turn] If you have 19 or more cards in your trash, your Leader gains +1000 power.
 * [Activate: Main] You may rest this card and 3 of your DON!! cards: Play up to 1 black "Five
 * Elders" type Character card with a cost equal to or less than the number of DON!! cards on your
 * field from your hand."
 *
 * Rules: CR 8-3-2-4 ([Your Turn] is a condition), CR 8-3-1 / 8-3-1-3 (costs), CR 8-4-4-1 ("up to"),
 * CR 6-5-5 (given DON!! are on the field), CR 3-7-6-1 (Character limit). Scenery: the Five Elders
 * Characters OP13-083 (cost 4), OP13-080 (cost 6), OP13-084 (cost 7), OP13-082 (cost 10), all
 * Black; OP13-085 Saint Jalmac ({Celestial Dragons}, not a Five Elders).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  chars,
  choices,
  don,
  doneRaw,
  hand,
  kind,
  LD13,
  mine,
  need,
  offered,
  offeredAbilities,
  offeredIds,
  payDon,
  pickRaw,
  pile,
  reachablePickSets,
  S13,
  SC15,
  accept,
  theirs,
  useAbility,
  trash,
} from './kit-op13d.ts';

const ID = 'OP13-099';
const FE4 = 'OP13-083';
const FE6 = 'OP13-080';
const FE7 = 'OP13-084';
const FE10 = 'OP13-082';
const JAL = S13.jalmac;

function start(
  o: {
    hand?: string[];
    active?: number;
    rested?: number;
    stageRested?: boolean;
    leaderDon?: number;
    chars?: string[];
    trash?: string[];
    deck?: string[];
  } = {},
): TestGame {
  return mine(
    o.leaderDon ? { card: LD13.black, don: o.leaderDon } : LD13.black,
    {
      hand: o.hand ?? [FE4, FE6, FE7, FE10, JAL],
      stage: o.stageRested ? { card: ID, rested: true } : ID,
      costArea: { active: o.active ?? 10, rested: o.rested ?? 0 },
      characters: o.chars ?? [],
      trash: o.trash ?? [],
      ...(o.deck ? { deck: o.deck } : {}),
    },
    {},
  );
}

const stage = (g: TestGame) => at(g, 'p1', 'stage', ID);

/** Activate and pay "rest this card and 3 DON!!"; the pick of the Character stays pending. */
function run(g: TestGame): void {
  useAbility(g, stage(g));
  if (offered(g, 'p1')) accept(g);
  payDon(g, 3);
}

describe('OP13-099 The Empty Throne: [Your Turn] 19 or more cards in the trash: Leader +1000', () => {
  it('boundary: 19 cards give +1000 on my turn, 18 give nothing', () => {
    const g19 = start({ trash: pile(19) });
    expect(g19.power(g19.leader('p1'))).toBe(6000);
    const g18 = start({ trash: pile(18) });
    expect(g18.power(g18.leader('p1'))).toBe(5000);
  });

  it('more than 19 still gives +1000 only (not per card)', () => {
    const g = start({ trash: pile(25) });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('[Your Turn] only: on the opponent’s turn the Leader has no bonus', () => {
    const g = theirs(LD13.black, { stage: ID, trash: pile(19) }, {});
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the bonus is for my Leader only, not for my Characters', () => {
    const g = start({ trash: pile(19), chars: [SC15.red3] });
    expect(g.power(at(g, 'p1', 'characters', SC15.red3))).toBe(5000);
  });
});

describe('OP13-099 The Empty Throne: [Activate: Main] rest this and 3 DON!!: play a black {Five Elders} Character from hand', () => {
  it('plays the chosen Character from the hand and pays only the 3 DON!! and the rested Stage', () => {
    const g = start();
    run(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p1', 'hand', FE7));
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([FE7]);
    expect(hand(g)).toEqual([FE4, FE6, FE10, JAL].sort());
    expect(g.card(stage(g)).rested).toBe(true);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });

  it('boundary: with 6 DON!! on the field a cost 6 card is offered, a cost 7 card is not', () => {
    const g = start({ active: 6 });
    run(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([FE4, FE6].sort());
  });

  it('with 10 DON!! even the cost 10 {Five Elders} is offered (rested DON!! still count)', () => {
    const g = start();
    run(g);
    expect(offeredIds(g)).toEqual([FE10, FE4, FE6, FE7].sort());
  });

  it('given DON!! count as DON!! on the field: 4 in the cost area and 3 given allow cost 7', () => {
    const g = start({ active: 4, leaderDon: 3 });
    run(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([FE4, FE6, FE7].sort());
  });

  it('only {Five Elders} cards: a {Celestial Dragons} Character that is not a {Five Elders} is not offered', () => {
    const g = start();
    run(g);
    expect(offeredIds(g)).not.toContain(JAL);
  });

  it('only from the hand: a {Five Elders} Character in the trash or on the deck is not offered', () => {
    const g = start({ hand: [FE4], trash: [FE6], deck: [FE7, ...pile(10)] });
    run(g);
    expect(offeredIds(g)).toEqual([FE4]);
  });

  it('"up to 1": choosing nothing is legal, the cost stays paid, and never two are played', () => {
    const g = start({ hand: [FE4, FE6] });
    run(g);
    need(g, 'choose', 'p1');
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    doneRaw(g);
    expect(chars(g)).toEqual([]);
    expect(g.card(stage(g)).rested).toBe(true);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });

  it('CR 8-3-1-3: an already rested Stage cannot pay "rest this card"', () => {
    const g = start({ stageRested: true });
    expect(offeredAbilities(g, stage(g))).toEqual([]);
  });

  it('CR 8-3-1-3: with only 2 active DON!! the 3 DON!! cannot be rested', () => {
    const g = start({ active: 2, rested: 8 });
    expect(offeredAbilities(g, stage(g))).toEqual([]);
  });

  it('[Activate: Main] is not available on the opponent’s turn', () => {
    const g = theirs(
      LD13.black,
      { stage: ID, hand: [FE4], costArea: { active: 10, rested: 0 } },
      {},
    );
    expect(offeredAbilities(g, at(g, 'p1', 'stage', ID))).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('with a full Character area the Character limit applies: one of mine is trashed to make room', () => {
    const g = start({
      hand: [FE4],
      chars: ['OP01-010', SC15.red2, SC15.red3, SC15.red4, SC15.red5],
    });
    run(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p1', 'hand', FE4));
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(5);
    pickRaw(g, at(g, 'p1', 'characters', 'OP01-010'));
    expect(chars(g)).toEqual([FE4, SC15.red2, SC15.red3, SC15.red4, SC15.red5].sort());
    expect(trash(g)).toEqual(['OP01-010']);
  });

  it('hidden-gate: with a non-empty hand and no {Five Elders} card in it the pick is still asked, at max 0', () => {
    const g = start({ hand: [JAL, SC15.red2] });
    run(g);
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(0);
    expect(choices(g)).toEqual([]);
    doneRaw(g);
    expect(g.card(stage(g)).rested).toBe(true);
  });
});
