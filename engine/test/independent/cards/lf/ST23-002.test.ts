/**
 * ST23-002 Shanks (Character, Red, cost 9, 10000, {The Four Emperors}/{Red-Haired Pirates}).
 *
 * Card text: "If your opponent has a Character with 8000 base power or more, give this card in your
 * hand -3 cost.
 * [On Play] If your Leader has the "Red-Haired Pirates" type or is [Uta], your Leader gains +2000
 * power until the end of your opponent's next End Phase."
 *
 * Rules: CR 2-7-6 (current cost), base power ignores buffs and debuffs, CR 3-1-6.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  donOf,
  kind,
  LB,
  mine,
  need,
  offeredAbilities,
  pickInst,
  playRaw,
  SL,
} from './kit-lfb.ts';

const ID = 'ST23-002';
const THATCH = SL.wb6; // 8000
const KINGDEW = SL.wb5; // 7000
const HONGO = 'OP09-011'; // [Activate: Main] may rest this: if Leader is Red-Haired Pirates, opposing Character -2000 this turn

function hold(leader: string, o: { active: number; p2chars?: string[]; chars?: string[] }) {
  return mine(
    leader,
    {
      hand: [ID],
      characters: o.chars ?? [],
      costArea: { active: o.active, rested: 10 - o.active },
    },
    { characters: o.p2chars ?? [] },
  );
}

const cost = (g: ReturnType<typeof hold>) => g.card(g.find('p1', 'hand', ID)).cost;
const canPlay = (g: ReturnType<typeof hold>) => {
  const card = g.find('p1', 'hand', ID);
  expect(g.decider).toBe('p1');
  return g.legal().some((a) => a.type === 'playCard' && a.card === card);
};

describe('ST23-002 Shanks: with an opposing Character of 8000 base power or more, this card in hand costs 3 less', () => {
  it('with an opposing 8000-power Character the cost is 6: playable with 6 active DON!!, paying 6', () => {
    const g = hold(LB.rhp, { active: 6, p2chars: [THATCH] });
    expect(cost(g)).toBe(6);
    expect(canPlay(g)).toBe(true);
    playRaw(g, ID);
    expect(donOf(g, 'p1').active).toBe(0);
  });

  it('with 5 active DON!! even the reduced cost of 6 cannot be paid', () => {
    const g = hold(LB.rhp, { active: 5, p2chars: [THATCH] });
    expect(canPlay(g)).toBe(false);
  });

  it('without such a Character the printed cost 9 applies', () => {
    const g = hold(LB.rhp, { active: 8, p2chars: [SL.c4] });
    expect(cost(g)).toBe(9);
    expect(canPlay(g)).toBe(false);
  });

  it('boundary: a 7000-power Character does not reduce the cost, 8000 does', () => {
    expect(cost(hold(LB.rhp, { active: 10, p2chars: [KINGDEW] }))).toBe(9);
    expect(cost(hold(LB.rhp, { active: 10, p2chars: [THATCH] }))).toBe(6);
  });

  it('a bigger Character counts too (10000 power)', () => {
    expect(cost(hold(LB.rhp, { active: 10, p2chars: [SL.big8] }))).toBe(6);
  });

  it("only the opponent's Characters count: my own 8000-power Character does not reduce the cost", () => {
    const g = hold(LB.rhp, { active: 8, chars: [THATCH] });
    expect(cost(g)).toBe(9);
    expect(canPlay(g)).toBe(false);
  });

  it('it is base power: an 8000 Character lowered to 6000 by my effect still reduces the cost', () => {
    const g = mine(
      LB.rhp,
      { hand: [ID], characters: [HONGO], costArea: { active: 10, rested: 0 } },
      { characters: [THATCH] },
    );
    expect(cost(g)).toBe(6);
    const hongo = at(g, 'p1', 'characters', HONGO);
    const [ability] = offeredAbilities(g, hongo);
    act(g, { type: 'activate', card: hongo, ability: ability! });
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', THATCH)]);
    expect(g.power(g.find('p2', 'characters', THATCH))).toBe(6000);
    expect(cost(g)).toBe(6);
  });

  it('the reduction is for the card in hand: once played, Shanks has its printed cost 9', () => {
    const g = hold(LB.rhp, { active: 10, p2chars: [THATCH] });
    playRaw(g, ID);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(9);
  });
});

describe("ST23-002 Shanks: [On Play] Red-Haired Pirates or [Uta] Leader gains +2000 until the end of the opponent's next End Phase", () => {
  const play = (leader: string) => {
    const g = hold(leader, { active: 10 });
    playRaw(g, ID);
    return g;
  };

  it('a Red-Haired Pirates Leader gains +2000 power, with no prompt', () => {
    const g = play(LB.rhp);
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a Leader that is [Uta] (no Red-Haired Pirates type) gains +2000 power too', () => {
    const g = play(LB.uta);
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a Leader that is neither gets nothing', () => {
    const g = play(LB.luffy);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(atMain(g)).toBe(true);
  });

  it("the boost lasts through the opponent's turn and is gone when my next turn begins", () => {
    const g = play(LB.rhp);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(7000);
    act(g, { type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only the Leader is boosted, not Shanks itself', () => {
    const g = play(LB.rhp);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(10000);
  });
});
