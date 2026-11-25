/** OP11-116 Merman Combat Ultramarine. */
import { describe, expect, it } from 'vitest';
import { dec, game, hand, none, option, pick, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { atMain, ids, optionIds, pickableCardIds, triggerGame } from './helpers-w7c1.ts';

const ID = 'OP11-116';

describe('OP11-116 Merman Combat Ultramarine', () => {
  const mk = (p1: object = {}, p2: object = {}) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: [ID],
        costArea: { active: 6, rested: 0 },
        characters: [V.c6, V.c7],
        life: [V.c3, V.c1, V.c2],
        ...p1,
      },
      { leader: PLAIN_BLUE, characters: [V.c5, V.c6], life: [V.c6, V.c4, V.c5], ...p2 },
    );
  const cast = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

  it("[Main]: an opponent's Character goes to the top of its owner's (the opponent's) Life face-up", () => {
    const g = mk();
    cast(g);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(optionIds(g)).toEqual(['top', 'bottom']);
    option(g, 'top');
    const life = g.zone('p2', 'life');
    expect(life.map((c) => c.card)).toEqual([V.c5, V.c6, V.c4, V.c5]);
    expect(life[0]!.faceUp).toBe(true);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c6]);
    expect(g.life('p1')).toBe(3);
    expect(atMain(g)).toBe(true);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it("[Main]: your own Character goes to the bottom of your own Life, not the opponent's", () => {
    const g = mk();
    cast(g);
    pick(g, [g.find('p1', 'characters', V.c6)]);
    option(g, 'bottom');
    expect(ids(g, 'p1', 'life')).toEqual([V.c3, V.c1, V.c2, V.c6]);
    expect(g.zone('p1', 'life')[3]!.faceUp).toBe(true);
    expect(g.life('p2')).toBe(3);
    expect(ids(g, 'p1', 'characters')).toEqual([V.c7]);
  });

  it('boundary: a cost of 6 can be added, a cost of 7 cannot (either player)', () => {
    const g = mk();
    cast(g);
    expect(pickableCardIds(g).sort()).toEqual([V.c5, V.c6, V.c6].sort());
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
  });

  it('"up to 1": none chosen moves nothing and asks nothing more', () => {
    const g = mk();
    cast(g);
    none(g);
    expect(g.life('p1')).toBe(3);
    expect(g.life('p2')).toBe(3);
    expect(atMain(g)).toBe(true);
  });

  it("[Trigger]: only an opponent's Character of cost 4 or less, to the owner's Life", () => {
    const g = triggerGame(ID, { characters: [V.c3] }, { characters: [V.c4, V.c5, V.c3] });
    g.act({ type: 'trigger', activate: true });
    // Mine (cost 3) is not a target; the opponent's cost 4 and 3 are, cost 5 and the attacker are not.
    expect(pickableCardIds(g).sort()).toEqual([V.c3, V.c4].sort());
    pick(g, [g.find('p2', 'characters', V.c4)]);
    option(g, 'bottom');
    const life = g.zone('p2', 'life');
    expect(life[life.length - 1]!.card).toBe(V.c4);
    expect(life[life.length - 1]!.faceUp).toBe(true);
    expect(ids(g, 'p1', 'characters')).toEqual([V.c3]);
    expect(dec(g)?.kind).not.toBe('trigger');
  });

  it('[Trigger] declined: the card goes to the hand and no Character moves', () => {
    const g = triggerGame(ID, {}, { characters: [V.c3] });
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toContain(ID);
    expect(ids(g, 'p2', 'characters')).toContain(V.c3);
  });
});
