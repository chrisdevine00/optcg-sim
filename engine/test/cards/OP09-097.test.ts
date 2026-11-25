/** OP09-097 Black Vortex (Event, cost 2). */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  counterStep,
  damageGame,
  dec,
  expectDecision,
  none,
  OTHER_LEADER,
  pick,
  useCounter,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-097';

describe('OP09-097 Black Vortex: [Counter]', () => {
  const start = () =>
    counterStep(
      {
        leader: OTHER_LEADER,
        hand: [ID],
        characters: [V.c4],
        costArea: { active: 3, rested: 0 },
      },
      { characters: [V.c3] },
    );
  const attacker = (g: ReturnType<typeof start>) => g.find('p2', 'characters', V.c7);

  it("negates the effect of up to 1 of your opponent's Leader or Character cards and gives it -4000 power this turn", () => {
    const g = start();
    useCounter(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, attacker(g))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(false);
    pick(g, [attacker(g)]);
    expect(g.card(attacker(g)).negated).toBe(true);
    expect(g.power(attacker(g))).toBe(5000); // 9000 - 4000
    expect(g.card(g.find('p2', 'characters', V.c3)).negated).toBeFalsy();
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    expectDecision(g, 'counter', 'p1');
  });

  it("the -4000 goes to the card the negate chose: the opponent's Leader", () => {
    const g = start();
    useCounter(g, ID);
    pick(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).negated).toBe(true);
    expect(g.power(g.leader('p2'))).toBe(1000); // 5000 - 4000
    expect(g.power(attacker(g))).toBe(9000);
  });

  it('the -4000 and the negation last the whole turn, not only the battle', () => {
    const g = start();
    useCounter(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    g.act({ type: 'endCounter' });
    // 9000 against the Leader's 5000: the Leader is hit; the battle is over.
    while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(1000);
    expect(g.card(g.find('p2', 'characters', V.c3)).negated).toBe(true);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    expect(g.card(g.find('p2', 'characters', V.c3)).negated).toBeFalsy();
  });

  it('"up to 1": choosing nobody changes nothing', () => {
    const g = start();
    useCounter(g, ID);
    none(g);
    expect(g.power(attacker(g))).toBe(9000);
    expect(g.card(attacker(g)).negated).toBeFalsy();
    expectDecision(g, 'counter', 'p1');
  });
});

describe('OP09-097 Black Vortex: [Trigger]', () => {
  it("negates the effect of up to 1 of your opponent's Leader or Character cards during this turn", () => {
    const g = damageGame(ID, { leader: OTHER_LEADER }, { characters: [V.c3] });
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).negated).toBe(true);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000); // no power change
    expect(g.card(g.leader('p2')).negated).toBeFalsy();
  });

  it('"up to 1": may negate nothing', () => {
    const g = damageGame(ID, { leader: OTHER_LEADER }, { characters: [V.c3] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c3)).negated).toBeFalsy();
  });
});
