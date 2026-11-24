/**
 * OP13-110 Stussy (Character, Yellow, cost 7, 7000, no Counter, {CP0}/{Egghead}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] If your Leader has the "Egghead" type, play up to 1 Character card
 * with a cost of 5 or less and a [Trigger] from your hand."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 8-3-3 (failed "if"), CR 8-4-4-1 ("up to"; an "up to" pick from
 * the hand is asked even when nothing matches), CR 3-7-6-1 (Character limit). Scenery:
 * OP17-107 Daifuku (cost 3, [Trigger]), OP13-109 Bonney (cost 5, [Trigger]), OP14-105 Gorgon Sisters
 * (cost 6, [Trigger]), OP06-105 Genbo (cost 3, no [Trigger]), OP13-096 (Event with [Trigger]).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  attack,
  blockers,
  chars,
  choices,
  deck,
  deckWith,
  don,
  doneRaw,
  hand,
  kind,
  LD13,
  mine,
  need,
  offeredIds,
  pickRaw,
  playRaw,
  reachablePickSets,
  S13,
  SC15,
  theirs,
  trash,
} from './kit-op13d.ts';

const ID = 'OP13-110';
const DAI = S13.daifuku;
const BON5 = S13.bonney5;
const GOR = S13.gorgon;
const GENBO = S13.genbo;

function start(
  o: {
    leader?: string;
    hand?: string[];
    chars?: string[];
    deck?: string[];
    trash?: string[];
  } = {},
): TestGame {
  const g = mine(o.leader ?? LD13.eggMulti, {
    hand: [ID, ...(o.hand ?? [DAI, BON5, GOR, GENBO])],
    characters: o.chars ?? [],
    deck: o.deck ?? deckWith([], 10),
    trash: o.trash ?? [],
  });
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

describe('OP13-110 Stussy: [Blocker]; [On Play] if my Leader is {Egghead}, play up to 1 Character with cost 5 or less and a [Trigger] from my hand', () => {
  it('has [Blocker] and can take an attack', () => {
    const g = theirs(LD13.eggMulti, { characters: [ID] }, {});
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });

  it('{Egghead} Leader: offers the Characters with a [Trigger] and cost 5 or less only; the pick is played for free', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BON5, DAI].sort());
    pickRaw(g, at(g, 'p1', 'hand', DAI));
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([DAI, ID].sort());
    expect(hand(g)).toEqual([BON5, GENBO, GOR].sort());
    expect(don(g)).toMatchObject({ active: 3, rested: 7 });
  });

  it('boundary: a cost 5 Character with a [Trigger] is playable, a cost 6 one is not offered', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(GOR);
    pickRaw(g, at(g, 'p1', 'hand', BON5));
    expect(chars(g)).toEqual([BON5, ID].sort());
  });

  it('a Character without a [Trigger] (Genbo) is never offered', () => {
    const g = start({ hand: [GENBO, GOR] });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      doneRaw(g);
    }
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([GENBO, GOR].sort());
  });

  it('an Event with a [Trigger] is not a Character card: not offered', () => {
    const g = start({ hand: ['OP13-096', DAI] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DAI]);
  });

  it('a Leader without the {Egghead} type: nothing is played and nothing is asked', () => {
    const g = start({ leader: LD13.yellow });
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      doneRaw(g);
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([BON5, DAI, GENBO, GOR].sort());
  });

  it('"up to 1": playing nothing is legal and never two are played', () => {
    const g = start();
    need(g, 'choose', 'p1');
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    doneRaw(g);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toHaveLength(4);
  });

  it('only from the hand: a matching Character on the deck or in the trash is not offered', () => {
    const g = start({ hand: [GENBO], deck: deckWith([DAI], 10), trash: [BON5] });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      doneRaw(g);
    }
    expect(chars(g)).toEqual([ID]);
    expect(deck(g)[0]).toBe(DAI);
    expect(trash(g)).toEqual([BON5]);
  });

  it('with a full Character area (Stussy is the 5th) the Character limit asks which of mine to trash', () => {
    const g = start({ hand: [DAI], chars: [SC15.red2, SC15.red3, SC15.red4, SC15.red5] });
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p1', 'hand', DAI));
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(5);
    pickRaw(g, at(g, 'p1', 'characters', SC15.red2));
    expect(chars(g)).toEqual([DAI, ID, SC15.red3, SC15.red4, SC15.red5].sort());
    expect(trash(g)).toEqual([SC15.red2]);
  });

  it('hidden-gate: with a non-empty hand and no matching card the pick is still asked, at max 0 (a prompt may not depend on hidden cards)', () => {
    const g = start({ hand: [GENBO, GOR] });
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(0);
    expect(choices(g)).toEqual([]);
    doneRaw(g);
    expect(atMain(g)).toBe(true);
  });
});
