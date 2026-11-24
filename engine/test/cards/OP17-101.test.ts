/** OP17-101 Caribou. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  dec,
  expectDecision,
  game,
  hand,
  none,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { triggerHit } from './helpers-robin.ts';

const ID = 'OP17-101';
const mainGame = () =>
  game(
    { leader: PLAIN_PURPLE, characters: [ID], life: [BLUE, PURPLE, PURPLE] },
    { leader: PLAIN_BLUE, characters: [V.c6] },
  );
const use = (g: ReturnType<typeof mainGame>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'power-down' });

describe('OP17-101 Caribou', () => {
  it('[Activate: Main] add the top Life card to your hand: gives up to 1 Character −3000 power this turn', () => {
    const g = mainGame();
    use(g);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([BLUE]); // the top Life card, with no [Trigger] check
    const target = g.find('p2', 'characters', V.c6);
    pick(g, [target]);
    expect(g.power(target)).toBe(5000);
    g.act({ type: 'endTurn' });
    expect(g.power(target)).toBe(8000);
  });

  it('"up to 1": the Life card is still taken when no target is chosen', () => {
    const g = mainGame();
    use(g);
    none(g);
    expect(g.life('p1')).toBe(2);
    expect(g.power(g.find('p2', 'characters', V.c6))).toBe(8000);
  });

  it('[Once Per Turn]: cannot be used a second time', () => {
    const g = mainGame();
    use(g);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID)),
    ).toBe(false);
    expect(g.life('p1')).toBe(2);
  });

  it('cannot be activated with no Life cards (the cost cannot be paid)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [ID], life: [] },
      { leader: PLAIN_BLUE, characters: [V.c6] },
    );
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });

  it('[Trigger] trash 1 card: K.O.s up to 1 Character with a cost of 5 or less', () => {
    const g = triggerHit(ID, { hand: [BLUE] }, [V.c5, V.c6]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(trash(g, 'p1')).toContain(BLUE);
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c6, V.c7].sort());
  });

  it('[Trigger]: a Character with a cost of 6 is not a legal target', () => {
    const g = triggerHit(ID, { hand: [BLUE] }, [V.c6]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', BLUE)]);
    // Only the cost-5-or-less Characters qualify: here none (V.c7 attacker is cost 7).
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expectDecision(g, 'main', 'p2');
  });

  it('[Trigger] with an empty hand the cost cannot be paid: nothing is K.O.d', () => {
    const g = triggerHit(ID, { hand: [] }, [V.c5]);
    // The cost cannot be paid, so the [Trigger] cannot be activated.
    expect(g.isLegal({ type: 'trigger', activate: true, player: 'p1' })).toBe(false);
    g.act({ type: 'trigger', activate: false });
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });
});
