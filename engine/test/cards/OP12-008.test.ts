/** OP12-008 Shanks (cost 4, [Blocker]). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  expectDecision,
  game,
  passBlock,
  pick,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { at, choices } from './helpers-op12g1.ts';

const ID = 'OP12-008';

describe('OP12-008 Shanks', () => {
  /** p2 attacks p1's Leader with the Characters in `attackers` (the first one) on p2's turn 4. */
  const attack = (hand: string[] = [V.c1, V.c2], attackers: string[] = [V.c6]) => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [ID], hand },
      { leader: PLAIN_BLUE, characters: attackers },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', attackers[0]!),
      target: g.leader('p1'),
    });
    return g;
  };

  it('has [Blocker] (printed)', () => {
    const g = attack();
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("[On Your Opponent's Attack]: trash 1 card from your hand: -2000 power on up to 1 opposing Leader or Character", () => {
    const g = attack();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    // The Leader and the attacking Character are both offered.
    expect(choices(g).sort()).toEqual([g.leader('p2'), at(g, 'p2', 'characters', V.c6)].sort());
    pick(g, [at(g, 'p2', 'characters', V.c6)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([V.c1]);
    expect(g.power(at(g, 'p2', 'characters', V.c6))).toBe(6000);
    passBlock(g);
  });

  it('the -2000 can target the opposing Leader, and may go below the printed value for the turn', () => {
    const g = attack();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    pick(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(3000);
  });

  it('"up to 1": the target may be skipped, the card is still trashed (cost)', () => {
    const g = attack();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    g.act({ type: 'done' });
    expect(g.zone('p1', 'trash')).toHaveLength(1);
    expect(g.power(at(g, 'p2', 'characters', V.c6))).toBe(8000);
  });

  it('declining the cost trashes nothing and changes no power', () => {
    const g = attack();
    decline(g);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    expect(g.power(at(g, 'p2', 'characters', V.c6))).toBe(8000);
  });

  it('with an empty hand the cost cannot be paid (accept is not legal)', () => {
    const g = attack([]);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  it('[Once Per Turn]: a second attack in the same turn does not offer it again', () => {
    const g = attack([V.c1, V.c2], [V.c6, V.c5]);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    g.act({ type: 'done' });
    passBlock(g);
    // Finish the first battle (no counter, take damage).
    while (g.legal().some((a) => a.type === 'endCounter' || a.type === 'trigger')) {
      g.act(
        g.legal().some((a) => a.type === 'endCounter')
          ? { type: 'endCounter' }
          : { type: 'trigger', activate: false },
      );
    }
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c5),
      target: g.leader('p1'),
    });
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
  });
});
