/** PRB02-004 Jewelry Bonney. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, option, V } from './helpers.ts';
import { finishBattle, mk } from './helpers-prbst.ts';

const ID = 'PRB02-004';

describe('PRB02-004 Jewelry Bonney', () => {
  /** p2 (turn 4) attacks p1's Leader with its first V.c4. */
  const start = (costArea = { active: 3, rested: 2 }, p2chars: string[] = [V.c4, V.c4]) => {
    const g = mk(
      { characters: [ID], costArea },
      { characters: p2chars },
      {
        turn: 4,
        activePlayer: 'p2',
      },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c4, 0),
      target: g.leader('p1'),
    });
    return g;
  };

  it('has [Blocker] (printed)', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("[On Your Opponent's Attack]: sets up to 1 DON!! as active (a count is asked)", () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1 });
  });

  it('"up to 1": choosing 0 sets none', () => {
    const g = start();
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it('with no rested DON!! nothing is asked and nothing changes', () => {
    const g = start({ active: 5, rested: 0 });
    expect(dec(g)?.kind).toBe('block');
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 0 });
  });

  it('Once Per Turn: the second attack of the same turn does not trigger it again', () => {
    const g = start();
    option(g, '1');
    finishBattle(g);
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c4, 1),
      target: g.leader('p1'),
    });
    expect(dec(g)?.kind).toBe('block');
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1 });
  });
});
