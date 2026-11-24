/** OP14-035 Yosaku. */
import { describe, expect, it } from 'vitest';
import { endCounter, expectDecision, passBlock, pick, takeDamage, V, none } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { canPick, FM_LEADER, isRested, mine, plantAndRun } from './helpers-op14g2.ts';

const ID = 'OP14-035';

const start = () =>
  mine(
    FM_LEADER,
    { characters: [ID] },
    {
      characters: [
        { card: V.c3, rested: true },
        { card: V.c4, rested: true },
        { card: V.c5, rested: true },
        V.c2,
      ],
    },
  );
const attack = (g: ReturnType<typeof start>) => {
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
};
const finish = (g: ReturnType<typeof start>) => {
  passBlock(g);
  endCounter(g);
  takeDamage(g);
};

describe('OP14-035 Yosaku', () => {
  it('attacking rests it: up to 1 rested opposing Character with cost 4 or less skips the next Refresh', () => {
    const g = start();
    attack(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // cost 4: boundary in
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false); // cost 5: out
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false); // active: not rested
    pick(g, [g.find('p2', 'characters', V.c4)]);
    finish(g);
    g.act({ type: 'endTurn' });
    expect(isRested(g, g.find('p2', 'characters', V.c4))).toBe(true); // stayed rested
    expect(isRested(g, g.find('p2', 'characters', V.c3))).toBe(false); // refreshed
    expect(isRested(g, g.find('p2', 'characters', V.c5))).toBe(false);
  });

  it('"up to 1": it may choose nothing', () => {
    const g = start();
    attack(g);
    none(g);
    finish(g);
    g.act({ type: 'endTurn' });
    expect(isRested(g, g.find('p2', 'characters', V.c3))).toBe(false);
  });

  it('is also rested by an effect on your turn: the same effect fires', () => {
    const g = mine(
      FM_LEADER,
      { characters: [ID, V.c1] },
      { characters: [{ card: V.c3, rested: true }] },
    );
    plantAndRun(g, V.c1, 'p1', [
      { do: { rest: { from: 'characters', owner: 'you', filter: { name: 'Yosaku' } } } },
    ]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
  });

  it('must not fire when it is rested on the opponent’s turn (by their effect)', () => {
    const g = mine(
      FM_LEADER,
      { characters: [ID] },
      { characters: [{ card: V.c3, rested: true }] },
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, { rest: { from: 'characters', owner: 'opponent' } });
    expect(isRested(g, g.find('p1', 'characters', ID))).toBe(true);
    // No choice for p1: the ability is [Your Turn] only.
    expectDecision(g, 'main', 'p2');
  });
});
