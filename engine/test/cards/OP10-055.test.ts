/** OP10-055 Marco. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, V } from './helpers.ts';
import { canPick, finishBattle, koBy, mk, restedCard, runMine } from './helpers-a10g2.ts';

const ID = 'OP10-055';

describe('OP10-055 Marco', () => {
  const start = () => mk({ characters: [ID] }, { characters: [V.c4, V.c5, V.c1] });

  it("[On K.O.] returns up to 1 of your opponent's Characters with a cost of 4 or less to the owner's hand", () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(hand(g, 'p2')).toEqual([V.c4]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('boundary: cost 4 and 1 are candidates, cost 5 is not', () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
  });

  it('"up to 1": may return nothing', () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    none(g);
    expect(hand(g, 'p2')).toEqual([]);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it("also fires when Marco is K.O.'d in battle", () => {
    const g = mk(
      { characters: [restedCard(ID)] },
      { characters: [V.c7, V.c4] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ID),
    });
    finishBattle(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(hand(g, 'p2')).toEqual([V.c4]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it("must not fire when Marco leaves the field without being K.O.'d", () => {
    const g = mk({ characters: [ID] }, { characters: [V.c4] });
    runMine(g, {
      move: {
        what: { from: 'characters', owner: 'you', pick: { exactly: 1 } },
        to: { zone: 'hand' },
      },
    });
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('has [Blocker]', () => {
    const g = start();
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});
