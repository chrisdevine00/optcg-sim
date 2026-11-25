/** OP09-041 Soul Franky Swing Arm Boxing Solid (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  counterStep,
  damageGame,
  dec,
  endCounter,
  expectDecision,
  none,
  ODYSSEY_LEADER,
  OTHER_LEADER,
  pick,
  rested,
  takeDamage,
  useCounter,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-041';

describe('OP09-041 Soul Franky Swing Arm Boxing Solid: [Counter]', () => {
  const start = (leader: string, characters: Parameters<typeof counterStep>[0]['characters']) =>
    counterStep({ leader, hand: [ID], characters, costArea: { active: 3, rested: 0 } });
  const active = (g: ReturnType<typeof start>, c: string) =>
    !g.card(g.find('p1', 'characters', c)).rested;

  it('+2000 power during this battle, then with an ODYSSEY Leader and 2 rested Characters, up to 2 Characters are set active', () => {
    const g = start(ODYSSEY_LEADER, [rested(V.c1), rested(V.c2), rested(V.c3)]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', V.c1), g.find('p1', 'characters', V.c3)]);
    expect(active(g, V.c1)).toBe(true);
    expect(active(g, V.c3)).toBe(true);
    expect(active(g, V.c2)).toBe(false); // "up to 2": the third stays rested
    expectDecision(g, 'counter', 'p1');
  });

  it('the +2000 lasts only during this battle', () => {
    const g = start(ODYSSEY_LEADER, [V.c1]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endCounter(g); // 9000 against 7000: the Leader is hit and the battle ends
    takeDamage(g);
    expectDecision(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('boundary: with 1 rested Character only the power is given; no set-active choice is asked', () => {
    const g = start(ODYSSEY_LEADER, [rested(V.c1), V.c2]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expectDecision(g, 'counter', 'p1');
    expect(active(g, V.c1)).toBe(false);
  });

  it('must not set Characters active without an ODYSSEY Leader', () => {
    const g = start(OTHER_LEADER, [rested(V.c1), rested(V.c2)]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expectDecision(g, 'counter', 'p1');
    expect(active(g, V.c1)).toBe(false);
    expect(active(g, V.c2)).toBe(false);
  });

  it('"Then" is not "If you do": choosing nobody for the power still sets Characters active', () => {
    const g = start(ODYSSEY_LEADER, [rested(V.c1), rested(V.c2)]);
    useCounter(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(active(g, V.c2)).toBe(true);
  });

  it('"up to 2": may set nobody active', () => {
    const g = start(ODYSSEY_LEADER, [rested(V.c1), rested(V.c2)]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    none(g);
    expect(active(g, V.c1)).toBe(false);
    expect(active(g, V.c2)).toBe(false);
    expect(dec(g)?.kind).toBe('counter');
  });

  it("only your Characters can be set active, not your Leader or the opponent's", () => {
    const g = counterStep(
      {
        leader: ODYSSEY_LEADER,
        hand: [ID],
        characters: [rested(V.c1), rested(V.c2)],
        costArea: { active: 3, rested: 0 },
      },
      { characters: [rested(V.c3)] },
    );
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
  });
});

describe('OP09-041 Soul Franky Swing Arm Boxing Solid: [Trigger]', () => {
  it("rests up to 1 of your opponent's Characters with a cost of 4 or less", () => {
    const g = damageGame(ID, { leader: OTHER_LEADER }, { characters: [V.c3, V.c4, V.c5] });
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // cost 4: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
  });
});
