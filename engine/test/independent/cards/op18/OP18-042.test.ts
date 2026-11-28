/**
 * OP18-042 Hack (Character, Blue, cost 3, 4000, {Fish-Man}/{Dressrosa}/{Revolutionary Army}).
 *
 * Card text (cards/data):
 *   "[On K.O.] Draw 1 card.
 *    [Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to 1 of your {Dressrosa} type
 *    Leader or Characters."
 *
 * Rules: [On K.O.] fires when Hack is K.O.'d (battle or effect). Giving DON!! moves a rested DON!!
 * from the cost area onto the target (CR 6-5-5, given DON!! stay with the card). Only a rested DON!!
 * can be given; "up to 1" allows giving none; the target must be a {Dressrosa} Leader or Character
 * of mine (Hack herself is {Dressrosa}). Once Per Turn.
 *
 * Scenery: OP01-076 Bellamy (Blue, cost 2, 4000, {Dressrosa}); OP02-006 Kingdew (Red, cost 5, 7000,
 * no type); EB01-040 Kyros (Black/Yellow Leader, {Dressrosa}); ST01-001 Luffy (Red Leader).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  canActivate,
  cardIds,
  CH,
  choices,
  donOf,
  kind,
  LDR,
  mine,
  need,
  offeredAbilities,
  RED,
  side,
  strike,
  theirs,
  toMyNextMain,
  VAN,
} from './kit-d.ts';

const HACK = 'OP18-042';
const BELLAMY = 'OP01-076';
const KYROS = 'EB01-040';

function game(leader: string = LDR.luffy, p1: Partial<PlayerSpec> = {}): TestGame {
  return mine(leader, {
    characters: [HACK, BELLAMY, CH.kingdew5],
    costArea: { active: 3, rested: 3 },
    ...p1,
  });
}

function start(g: TestGame) {
  const hack = at(g, 'p1', 'characters', HACK);
  act(g, { type: 'activate', card: hack, ability: offeredAbilities(g, hack)[0]! });
}

/** Answer the count ("1") and the target question, in whichever order they come. */
function give(g: TestGame, count: number, target: string) {
  for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
    const d = need(g, 'choose', 'p1');
    if (d.purpose === 'mode') act(g, { type: 'pick', choice: { option: String(count) } });
    else act(g, { type: 'pick', choice: target });
  }
}

describe('OP18-042 Hack: [On K.O.] draw 1 card', () => {
  it('K.O.’d in battle: its owner draws 1 card', () => {
    const g = theirs(
      LDR.luffy,
      {
        characters: [{ card: HACK, rested: true }],
        deck: [VAN.komachiyo, VAN.sai, VAN.sai, VAN.sai],
      },
      { characters: [CH.kingdew5] },
    );
    strike(g, g.find('p2', 'characters', CH.kingdew5), g.find('p1', 'characters', HACK));
    expect(cardIds(g, 'p1', 'trash')).toEqual([HACK]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.komachiyo]);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(3);
  });

  it('it does not draw when Hack is merely rested or attacked and survives', () => {
    // Hack is 4000, rested; the opponent's 3000 Sunny-Kun attacks it and fails.
    const g = theirs(
      LDR.luffy,
      { characters: [{ card: HACK, rested: true }], deck: [VAN.komachiyo, VAN.sai] },
      { characters: [VAN.sunny] },
    );
    strike(g, g.find('p2', 'characters', VAN.sunny), g.find('p1', 'characters', HACK));
    expect(cardIds(g, 'p1', 'characters')).toEqual([HACK]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });
});

describe('OP18-042 Hack: [Activate: Main] [Once Per Turn] give up to 1 rested DON!! to a {Dressrosa} Leader or Character', () => {
  it('gives a rested DON!! to a {Dressrosa} Character: rested -1, given +1, the target gets +1000', () => {
    const g = game();
    const bellamy = at(g, 'p1', 'characters', BELLAMY);
    start(g);
    give(g, 1, bellamy);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 2, given: 1 });
    expect(g.card(bellamy).don).toBe(1);
    expect(g.power(bellamy)).toBe(5000);
    expect(kind(g)).toBe('main');
  });

  it('Hack herself is {Dressrosa} and may be the target', () => {
    const g = game();
    const hack = at(g, 'p1', 'characters', HACK);
    start(g);
    expect(choices(g).length).toBeGreaterThan(0);
    give(g, 1, hack);
    expect(g.card(hack).don).toBe(1);
  });

  it('a {Dressrosa} Leader is a legal target too, and a non-{Dressrosa} Character (Kingdew) is not offered', () => {
    const g = game(KYROS);
    start(g);
    const offered = [...choices(g)];
    // Count question may come first; answer it, then inspect the target pick.
    if (need(g, 'choose').purpose === 'mode') act(g, { type: 'pick', choice: { option: '1' } });
    const targets = choices(g);
    expect(targets).toContain(g.leader('p1'));
    expect(targets).toContain(at(g, 'p1', 'characters', BELLAMY));
    expect(targets).not.toContain(at(g, 'p1', 'characters', CH.kingdew5));
    void offered;
    act(g, { type: 'pick', choice: g.leader('p1') });
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('a non-{Dressrosa} Leader (Luffy) is not offered as a target', () => {
    const g = game();
    start(g);
    if (need(g, 'choose').purpose === 'mode') act(g, { type: 'pick', choice: { option: '1' } });
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', CH.kingdew5));
  });

  it('"up to 1": giving none is allowed and no DON!! moves', () => {
    const g = game();
    start(g);
    for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
      const d = need(g, 'choose');
      if (d.purpose === 'mode') act(g, { type: 'pick', choice: { option: '0' } });
      else act(g, { type: 'done' });
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 3, given: 0 });
  });

  it('only a rested DON!! can be given: with none rested nothing is given', () => {
    const g = game(LDR.luffy, { costArea: { active: 4, rested: 0 } });
    if (canActivate(g, at(g, 'p1', 'characters', HACK))) {
      start(g);
      for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
        const d = need(g, 'choose');
        if (d.purpose === 'mode') {
          expect(d.options?.map((o) => o.id)).toEqual(['0']);
          act(g, { type: 'pick', choice: { option: '0' } });
        } else if (g.legal().some((a) => a.type === 'done')) act(g, { type: 'done' });
        else break;
      }
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 0, given: 0 });
  });

  it('[Once Per Turn]: not offered again this turn, offered again next turn', () => {
    const g = game();
    start(g);
    give(g, 1, at(g, 'p1', 'characters', BELLAMY));
    expect(canActivate(g, at(g, 'p1', 'characters', HACK))).toBe(false);
    toMyNextMain(g);
    expect(canActivate(g, at(g, 'p1', 'characters', HACK))).toBe(true);
  });

  it('the opponent’s {Dressrosa} Character is not a target ("of your")', () => {
    const g = mine(
      LDR.luffy,
      { characters: [HACK], costArea: { active: 3, rested: 3 } },
      { characters: [BELLAMY] },
    );
    start(g);
    if (need(g, 'choose').purpose === 'mode') act(g, { type: 'pick', choice: { option: '1' } });
    expect(choices(g)).toEqual([at(g, 'p1', 'characters', HACK)]);
    void RED;
    void side;
  });
});
