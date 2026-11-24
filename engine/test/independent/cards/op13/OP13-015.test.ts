/**
 * OP13-015 Makino (Character, Red, cost 1, 0 power, Counter +2000, {Windmill Village}, Wisdom).
 *
 * Card text: "[Activate: Main] You may rest this Character: Up to 1 of your [Monkey.D.Luffy] cards
 * gains +2000 power during this turn."
 *
 * Rules: CR 8-3 (the rest cost is paid to activate; a rested Character cannot pay it again),
 * CR 8-1-2 ("up to"), "during this turn" ends with the turn, +N modifiers stack. A
 * "[Monkey.D.Luffy] card" is one of my cards with that exact name, Leader or Character.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  endTurn,
  kind,
  L13,
  mine,
  need,
  none,
  offeredAbilities,
  offeredInsts,
  pickInst,
  playRaw,
  tryActivate,
  useAbility,
  V13,
} from './kit-op13a.ts';

const MAKINO = 'OP13-015';

function board(leader: string, chars: string[] = [], rested = false) {
  return mine(leader, {
    characters: [{ card: MAKINO, rested }, ...chars] as never,
    costArea: { active: 10, rested: 0 },
  });
}
const makino = (g: ReturnType<typeof board>, nth = 0) => at(g, 'p1', 'characters', MAKINO, nth);

describe('OP13-015 Makino: rest this Character, up to 1 [Monkey.D.Luffy] gains +2000 this turn', () => {
  it('printed values: cost 1, 0 power, Counter +2000', () => {
    const g = mine(L13.luffy, { hand: [MAKINO] });
    const c = g.card(at(g, 'p1', 'hand', MAKINO));
    expect(c.cost).toBe(1);
    expect(c.counter).toBe(2000);
    playRaw(g, MAKINO);
    expect(g.power(makino(g as never))).toBe(0);
  });

  it('activating rests Makino and gives my [Monkey.D.Luffy] Leader +2000', () => {
    const g = board(L13.luffy);
    useAbility(g, makino(g));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    need(g, 'main', 'p1');
    expect(g.card(makino(g)).rested).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('offers only cards named [Monkey.D.Luffy]: my Leader and Luffy Character, not another name, not the opposing Luffy Leader', () => {
    const g = board(L13.luffy, [V13.luffy, V13.ace, V13.marco]);
    useAbility(g, makino(g));
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([g.leader('p1'), at(g, 'p1', 'characters', V13.luffy)].sort());
    expect(offeredInsts(g)).not.toContain(g.leader('p2'));
  });

  it('a [Monkey.D.Luffy] Character can receive it (Leader of another name)', () => {
    const g = board(L13.shanks, [V13.luffy]);
    useAbility(g, makino(g));
    pickInst(g, [at(g, 'p1', 'characters', V13.luffy)]);
    expect(g.power(at(g, 'p1', 'characters', V13.luffy))).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": the boost may go to nobody; Makino stays rested (the cost was paid)', () => {
    const g = board(L13.luffy);
    useAbility(g, makino(g));
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(makino(g)).rested).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('gives +2000 to one card only (Leader and Character both qualify)', () => {
    const g = board(L13.luffy, [V13.luffy]);
    useAbility(g, makino(g));
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(at(g, 'p1', 'characters', V13.luffy))).toBe(6000);
  });

  it('a rested Makino cannot activate (the rest cost cannot be paid)', () => {
    const g = board(L13.luffy, [], true);
    expect(offeredAbilities(g, makino(g))).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only once per rest: after activating, Makino is rested and the ability is gone', () => {
    const g = board(L13.luffy);
    useAbility(g, makino(g));
    pickInst(g, [g.leader('p1')]);
    expect(offeredAbilities(g, makino(g))).toEqual([]);
  });

  it('two Makinos stack: +2000 each on the same Leader', () => {
    const g = mine(L13.luffy, {
      characters: [MAKINO, MAKINO],
      costArea: { active: 10, rested: 0 },
    });
    useAbility(g, makino(g as never, 0));
    pickInst(g, [g.leader('p1')]);
    const second = g.zone('p1', 'characters').find((c) => !c.rested)!.instance;
    useAbility(g, second);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it("the +2000 lasts this turn only: at the opponent's turn the Leader is back to 5000", () => {
    const g = board(L13.luffy);
    useAbility(g, makino(g));
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with no [Monkey.D.Luffy] card of mine, nothing gets a boost whether or not it can be activated', () => {
    const g = board(L13.shanks, [V13.ace]);
    if (tryActivate(g, makino(g)) && kind(g) === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', V13.ace))).toBe(6000);
  });
});
