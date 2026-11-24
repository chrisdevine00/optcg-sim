/** OP13-066 Silvers Rayleigh. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, pick, play, V } from './helpers.ts';
import { canPick, mine, OTHER_LEADER, settle, withDon } from './helpers-op13g3.ts';

const ID = 'OP13-066';

describe('OP13-066 Silvers Rayleigh', () => {
  const start = (given: boolean, opp: string[]) =>
    mine(
      { leader: given ? withDon(OTHER_LEADER) : OTHER_LEADER, hand: [ID] },
      { characters: opp },
      8,
    );
  const rested = (g: ReturnType<typeof start>, c: string) =>
    g.card(g.find('p2', 'characters', c)).rested;

  it('[On Play] with DON!! given: rests up to 1 opposing Character with a cost of 5 or less', () => {
    const g = start(true, [V.c5, V.c6]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(rested(g, V.c5)).toBe(true);
    expect(rested(g, V.c6)).toBe(false);
  });

  it('then adds up to 1 DON!! and sets it as active at the end of this turn', () => {
    const g = start(true, [V.c5]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expectDecision(g, 'main', 'p1');
    const mid = don(g, 'p1');
    g.act({ type: 'endTurn' });
    // The prompt (a count) comes at the end of the turn.
    addMost(g);
    expect(don(g, 'p1').active).toBe(mid.active + 1);
    expect(don(g, 'p1').rested).toBe(mid.rested);
  });

  it('with no DON!! given nothing happens now and nothing is added at the end of the turn', () => {
    const g = start(false, [V.c5]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(rested(g, V.c5)).toBe(false);
    const mid = don(g, 'p1');
    g.act({ type: 'endTurn' });
    // No end-of-turn prompt: the turn passes straight to p2, and p1's DON!! are as before.
    expectDecision(g, 'main', 'p2');
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(mid.active + mid.rested);
  });

  it('[Rush]: can attack the turn it is played', () => {
    const g = start(false, []);
    play(g, ID);
    expect(
      g.isLegal({
        type: 'attack',
        attacker: g.find('p1', 'characters', ID),
        target: g.leader('p2'),
        player: 'p1',
      }),
    ).toBe(true);
  });

  it('boundary: a cost-6 Character is not a target; the end-of-turn DON!! count may be 0', () => {
    const g = start(true, [V.c6]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    settle(g);
    const mid = don(g, 'p1');
    g.act({ type: 'endTurn' });
    // "up to 1": the count may be 0.
    const d = expectDecision(g, 'choose', 'p1');
    g.act({ type: 'pick', choice: { option: d.options!.at(-1)!.id } });
    expect(don(g, 'p1').active).toBe(mid.active);
  });
});
