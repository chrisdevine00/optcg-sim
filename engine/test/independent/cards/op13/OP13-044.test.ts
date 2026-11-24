/**
 * OP13-044 Curiel (Character, Blue, cost 3, 4000, no Counter, {Whitebeard Pirates}).
 *
 * Card text: "[When Attacking] Give up to 1 rested DON!! card to your Leader with a type including
 * "Whitebeard Pirates" or 1 Character with a type including "Whitebeard Pirates".
 * [On K.O.] Draw 1 card."
 *
 * Rules: digest 55 (only rested cost-area DON!! can be given), CR 8-4-4-1 ("up to"), "type
 * including" is a substring test on a single type (CR 1-3-... / digest "type including"), digest
 * 109 (trash is not a K.O.).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  BLUE,
  choices,
  decision,
  dons,
  handOf,
  isMain,
  mine,
  need,
  noDefence,
  offeredIds,
  pickInst,
  playRaw,
  theirs,
  WL,
  WV,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const CURIEL = 'OP13-044';

function board(
  leader: string,
  chars: string[],
  active = 3,
  rested = 4,
): { g: TestGame; curiel: string } {
  const g = mine(leader, { characters: [CURIEL, ...chars], costArea: { active, rested } });
  const curiel = g.find('p1', 'characters', CURIEL);
  attack(g, curiel, g.leader('p2'));
  return { g, curiel };
}

describe('OP13-044 Curiel: [When Attacking] give a rested DON!! to a Whitebeard Pirates Leader/Character; [On K.O.] draw 1', () => {
  it('offers my {Whitebeard Pirates} Leader and Characters (substrings count), not other Characters', () => {
    const { g } = board(WL.ace, [WV.thatch, WV.marco, WV.doma, WV.mohji]);
    need(g, 'choose', 'p1');
    const ids = choices(g).map((i) => g.card(i).card);
    // Leader Ace, Curiel itself, Thatch, Marco (Former Whitebeard Pirates), Doma (Whitebeard Pirates Allies)
    expect(ids.sort()).toEqual([WL.ace, CURIEL, WV.thatch, WV.marco, WV.doma].sort());
    expect(ids).not.toContain(WV.mohji);
  });

  it('a Leader without a {Whitebeard Pirates} type is not offered', () => {
    const { g } = board(WL.croc, [WV.thatch]);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).toEqual([CURIEL, WV.thatch].sort());
  });

  it('gives exactly 1 rested DON!! to the chosen Character', () => {
    const { g } = board(WL.ace, [WV.thatch]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', WV.thatch)]);
    expect(g.card(g.find('p1', 'characters', WV.thatch)).don).toBe(1);
    expect(dons(g)).toMatchObject({ active: 3, rested: 3, given: 1 });
  });

  it('gives it to my Leader when chosen', () => {
    const { g } = board(WL.ace, []);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the given DON!! adds +1000 power to the receiver', () => {
    const { g } = board(WL.ace, [WV.thatch]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', WV.thatch)]);
    expect(g.power(g.find('p1', 'characters', WV.thatch))).toBe(9000);
  });

  it('"up to 1": choosing nothing gives nothing', () => {
    const { g } = board(WL.ace, [WV.thatch]);
    need(g, 'choose', 'p1');
    expect(decision(g)?.min).toBe(0);
    act(g, { type: 'done' });
    expect(dons(g)).toMatchObject({ rested: 4, given: 0 });
  });

  it('only active DON!! (nothing rested): nothing can be given', () => {
    const { g } = board(WL.ace, [WV.thatch], 10, 0);
    if (decision(g)?.kind === 'choose') {
      // the pick may be asked; whatever is chosen, no DON!! can move
      const pick = g.legal().find((a) => a.type === 'pick');
      if (pick) g.act(pick);
      else act(g, { type: 'done' });
    }
    expect(dons(g)).toMatchObject({ active: 10, rested: 0, given: 0 });
    expect(g.card(g.find('p1', 'characters', WV.thatch)).don).toBe(0);
  });

  it('[On K.O.]: K.O.d in battle on the opponent turn, I draw 1', () => {
    const g = theirs(
      WL.croc,
      { characters: [{ card: CURIEL, rested: true }], deck: [WV.marco, BLUE, BLUE, BLUE] },
      { characters: [WV.thatch] },
    );
    attack(g, g.find('p2', 'characters', WV.thatch), g.find('p1', 'characters', CURIEL));
    noDefence(g);
    expect(handOf(g)).toEqual([WV.marco]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([CURIEL]);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('must not happen: trashed for the 5-Character limit is not a K.O., so no draw', () => {
    const g = mine(WL.croc, {
      hand: [WV.mohji],
      characters: [CURIEL, WV.marco, WV.sai, WV.jil, WV.kingdew],
    });
    playRaw(g, WV.mohji);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', CURIEL)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([CURIEL]);
    expect(handOf(g)).toEqual([]);
  });

  it('the [When Attacking] does not fire when another Character attacks', () => {
    const g = mine(WL.ace, { characters: [CURIEL, WV.thatch], costArea: { active: 3, rested: 4 } });
    attack(g, g.find('p1', 'characters', WV.thatch), g.leader('p2'));
    expect(dons(g)).toMatchObject({ rested: 4, given: 0 });
    expect(decision(g)?.kind).toBe('block');
  });
});
