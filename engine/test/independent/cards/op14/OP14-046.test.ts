/**
 * OP14-046 Koala (Character, Blue, cost 2, 0 power, Counter +2000, {Foolshout Island}).
 *
 * Card text: "[Activate: Main] You may trash this Character: Up to 1 of your {Fish-Man} or {Merfolk}
 * type Leader or Character cards gains +2000 power during this turn."
 *
 * Rules: CR 8-3-1 (cost all or nothing), CR 4-8-1 ("up to"), CR 3-7-4 (summoning sickness does not
 * stop an [Activate: Main]), CR 6-6-1-2 ("during this turn" ends with the turn), CR 10-2-1 (trashing
 * is not a K.O.).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  abilities,
  activate,
  atMain,
  C14,
  canFinish,
  choices,
  choose,
  endTurn,
  inst,
  kind,
  L14,
  mine,
  need,
  offeredNow,
  theirs,
  trash,
  useCounter,
  hand,
} from './kit-op14b.ts';

const KOALA = 'OP14-046';

function start(leader: string, chars: string[], p2chars: string[] = []) {
  return mine(leader, { characters: [KOALA, ...chars] }, { characters: p2chars });
}
const koala = (g: ReturnType<typeof start>) => inst(g, 'p1', 'characters', KOALA);

describe('OP14-046 Koala: [Activate: Main] trash this: a {Fish-Man} or {Merfolk} Leader or Character gets +2000 this turn', () => {
  it('+2000 to a {Fish-Man} Leader (5000 -> 7000); Koala is trashed', () => {
    const g = start(L14.fish, [C14.namule]);
    activate(g, koala(g));
    need(g, 'choose', 'p1');
    choose(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(trash(g)).toEqual([KOALA]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([C14.namule]);
  });

  it('+2000 to a {Fish-Man} Character (5000 -> 7000)', () => {
    const g = start(L14.luffy, [C14.namule]);
    activate(g, koala(g));
    choose(g, [inst(g, 'p1', 'characters', C14.namule)]);
    expect(g.power(inst(g, 'p1', 'characters', C14.namule))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('+2000 to a {Merfolk} Character (3000 -> 5000)', () => {
    const g = start(L14.luffy, [C14.camie]);
    activate(g, koala(g));
    choose(g, [inst(g, 'p1', 'characters', C14.camie)]);
    expect(g.power(inst(g, 'p1', 'characters', C14.camie))).toBe(5000);
  });

  it("offers a {Fish-Man} Leader and {Fish-Man}/{Merfolk} Characters only: not other Characters, not the opponent's", () => {
    const g = start(L14.fish, [C14.namule, C14.camie, C14.marco], [C14.jinbe4]);
    activate(g, koala(g));
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.camie, C14.namule, L14.fish].sort());
  });

  it('a Leader without {Fish-Man}/{Merfolk} is not offered', () => {
    const g = start(L14.luffy, [C14.namule]);
    activate(g, koala(g));
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([inst(g, 'p1', 'characters', C14.namule)]);
  });

  it('a {Merfolk} Leader is offered', () => {
    const g = start(L14.merfolk, [C14.marco]);
    const a = abilities(g, koala(g));
    expect(a).toHaveLength(1);
    activate(g, koala(g));
    if (kind(g) === 'choose') choose(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('"up to 1": choosing no target still costs Koala and nobody gains power', () => {
    const g = start(L14.fish, [C14.namule]);
    activate(g, koala(g));
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(trash(g)).toEqual([KOALA]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(inst(g, 'p1', 'characters', C14.namule))).toBe(5000);
  });

  it('only one card gains the power even when several qualify', () => {
    const g = start(L14.fish, [C14.namule, C14.camie]);
    activate(g, koala(g));
    choose(g, [inst(g, 'p1', 'characters', C14.camie)]);
    expect(g.power(inst(g, 'p1', 'characters', C14.camie))).toBe(5000);
    expect(g.power(inst(g, 'p1', 'characters', C14.namule))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("the +2000 lasts this turn only: it is gone when the opponent's turn starts", () => {
    const g = start(L14.fish, [C14.namule]);
    activate(g, koala(g));
    choose(g, [inst(g, 'p1', 'characters', C14.namule)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(inst(g, 'p1', 'characters', C14.namule))).toBe(5000);
  });

  it('it can be activated on the turn it is played (no summoning sickness for [Activate: Main])', () => {
    const g = mine(L14.fish, { characters: [{ card: KOALA, playedThisTurn: true }] });
    activate(g, koala(g));
    if (kind(g) === 'choose') choose(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('as a Counter from the hand it adds +2000 (its printed Counter value)', () => {
    const g = theirs(L14.fish, { hand: [KOALA] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    useCounter(g, inst(g, 'p1', 'hand', KOALA), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(7000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
  });
});
