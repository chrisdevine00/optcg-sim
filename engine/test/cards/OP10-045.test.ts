/** OP10-045 Cavendish. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, pick, trash, V } from './helpers.ts';
import { attack, finishBattle, mk, runMine } from './helpers-a10g2.ts';

const ID = 'OP10-045';

describe('OP10-045 Cavendish', () => {
  const start = () => mk({ characters: [ID], hand: [V.c1, V.c2] });

  it('[When Attacking] draws 2 cards, then trashes 1 card from your hand', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    // The 2 cards are already drawn: 4 in hand to choose from.
    expect(hand(g, 'p1')).toHaveLength(4);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
    finishBattle(g);
  });

  it('may trash a card that was just drawn', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    pick(g, [g.find('p1', 'hand', 'OP02-060')]);
    expect(trash(g, 'p1')).toEqual(['OP02-060']);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2, 'OP02-060']);
  });

  it('with an empty hand it still draws 2 and then must trash 1', () => {
    const g = mk({ characters: [ID], hand: [] });
    attack(g, g.find('p1', 'characters', ID));
    expect(hand(g, 'p1')).toHaveLength(2);
    pick(g, [g.zone('p1', 'hand')[0]!.instance]);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(trash(g, 'p1')).toHaveLength(1);
  });

  it('[Once Per Turn]: a second attack the same turn draws nothing', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    pick(g, [g.find('p1', 'hand', V.c1)]);
    finishBattle(g);
    runMine(g, { setActive: { from: 'characters', owner: 'you', pick: { upTo: 1 } } });
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(hand(g, 'p1')).toHaveLength(3);
    attack(g, g.find('p1', 'characters', ID));
    expect(dec(g)?.kind).not.toBe('choose');
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });

  it("must not fire when it is on the opponent's attack target side (only [When Attacking])", () => {
    const g = mk(
      { characters: [ID], hand: [V.c1] },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });
});
