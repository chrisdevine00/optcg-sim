/**
 * OP13-039 Gum-Gum Snake Shot (Event, Green, cost 2, {Straw Hat Crew}/{Supernovas}/{Fish-Man
 * Island}).
 *
 * Card text: "[Counter] K.O. up to 1 of your opponent's rested Characters with a cost of 4 or less."
 * "[Trigger] Activate this card's [Counter] effect."
 *
 * Rules: CR 7-1 ([Counter] events are used in the Counter Step), CR 8-4-4-1 ("up to"), RL-17 (an
 * attacker is rested by attacking), CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  BLUE,
  canCounterWith,
  choices,
  decision,
  isMain,
  kind,
  mine,
  need,
  offeredIds,
  passBlock,
  takeDamage,
  pickInst,
  theirs,
  useCounter,
  dons,
  WL,
  WV,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SNAKE = 'OP13-039';

/**
 * p2's turn. p2 has an attacking Jil (cost 4, active, rests when it attacks), a rested Sai (2), an
 * active Marco (3) and a rested Kingdew (5). Jil attacks my Leader; I am in the Counter Step.
 */
function counterStep(life: string[] = [BLUE, BLUE, BLUE, BLUE]): TestGame {
  const g = theirs(
    WL.croc,
    { hand: [SNAKE], costArea: { active: 5, rested: 0 }, life },
    {
      characters: [
        WV.jil,
        { card: WV.sai, rested: true },
        WV.marco,
        { card: WV.kingdew, rested: true },
      ],
    },
  );
  attack(g, g.find('p2', 'characters', WV.jil), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

function snake(g: TestGame): void {
  useCounter(g, g.find('p1', 'hand', SNAKE), g.leader('p1'));
}

describe('OP13-039 Gum-Gum Snake Shot: [Counter] K.O. up to 1 rested Character with cost 4 or less', () => {
  it('can be used in the Counter Step', () => {
    const g = counterStep();
    expect(canCounterWith(g, g.find('p1', 'hand', SNAKE))).toBe(true);
  });

  it('offers only rested opposing Characters with cost 4 or less (the attacker counts: it is rested)', () => {
    const g = counterStep();
    snake(g);
    need(g, 'choose', 'p1');
    // Jil (4, rested by attacking) and Sai (2, rested); not Marco (active), not Kingdew (cost 5)
    expect(offeredIds(g)).toEqual([WV.jil, WV.sai].sort());
  });

  it('K.O.s the chosen Character: it goes to its owner trash, the others stay', () => {
    const g = counterStep();
    snake(g);
    pickInst(g, [g.find('p2', 'characters', WV.sai)]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([WV.sai]);
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([WV.jil, WV.marco, WV.kingdew].sort());
  });

  it('K.O.ing the attacker ends the attack: no damage to my Leader', () => {
    const g = counterStep();
    snake(g);
    pickInst(g, [g.find('p2', 'characters', WV.jil)]);
    // the Counter Step may still be open for further Counters; finish it
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('"up to 1": choosing nothing K.O.s nothing and the attack goes on', () => {
    const g = counterStep();
    snake(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(g.zone('p2', 'trash')).toEqual([]);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(3);
  });

  it('pays its cost of 2 DON!! and goes to the trash', () => {
    const g = counterStep();
    snake(g);
    expect(dons(g)).toMatchObject({ active: 3, rested: 2 });
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([SNAKE]);
    expect(g.zone('p1', 'hand')).toEqual([]);
  });

  it('it is not playable in my own Main Phase (it only has a [Counter] effect)', () => {
    const g = mine(WL.croc, { hand: [SNAKE] }, { characters: [{ card: WV.sai, rested: true }] });
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', SNAKE)),
    ).toBe(false);
    expect(decision(g)?.kind).toBe('main');
  });

  it('[Trigger]: activates the [Counter] effect when taken as Life damage (no cost paid)', () => {
    const g = theirs(
      WL.croc,
      { life: [SNAKE, BLUE, BLUE, BLUE], costArea: { active: 0, rested: 3 } },
      { characters: [WV.jil, { card: WV.sai, rested: true }] },
    );
    attack(g, g.find('p2', 'characters', WV.jil), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([WV.jil, WV.sai].sort());
    pickInst(g, [g.find('p2', 'characters', WV.sai)]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([WV.sai]);
    expect(dons(g)).toMatchObject({ active: 0, rested: 3 });
  });

  it('[Trigger] with no rested Character of cost 4 or less: nothing is K.O.d', () => {
    const g = theirs(
      WL.croc,
      { life: [SNAKE, BLUE, BLUE, BLUE] },
      { characters: [WV.thatch, WV.marco] },
    );
    attack(g, g.find('p2', 'characters', WV.thatch), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    // Thatch is rested but costs 6; Marco is active: no candidate. An empty pick may be asked.
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(g.zone('p2', 'trash')).toEqual([]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });
});
