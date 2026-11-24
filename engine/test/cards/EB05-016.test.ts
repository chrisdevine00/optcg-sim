/** EB05-016 Nico Robin. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { SHC } from './helpers-luffyace.ts';

const ID = 'EB05-016';
/** Wisdom vanilla Characters: cost 1, cost 2 and cost 6. */
const W1 = 'OP03-052';
const W2 = 'OP03-046';
const W6 = 'OP02-007';

const start = (hand: string[]) =>
  game(
    { leader: PLAIN_PURPLE, hand: [ID, ...hand], costArea: { active: 6, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('EB05-016 Nico Robin', () => {
  it('[Your Turn] [On Play]: plays up to 1 Wisdom Character with a cost of 5 or less from your hand', () => {
    const g = start([W2, W1]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', W2)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([ID, W2].sort());
    // Only one is played, and it did not cost DON!!.
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([W1]);
  });

  it('a cost 6 Wisdom Character and a non-Wisdom Character are not candidates', () => {
    const g = start([W6, SHC.franky4]);
    play(g, ID);
    // Nothing in hand qualifies (the hand is hidden, so the empty choice is still asked).
    none(g);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(g.zone('p1', 'hand')).toHaveLength(2);
  });

  it('"up to": it may play nothing', () => {
    const g = start([W1]);
    play(g, ID);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([W1]);
  });

  it("[Trigger]: rests up to 1 of your opponent's Characters with a cost of 6 or less", () => {
    const g = damageGame(ID, { leader: PLAIN_PURPLE, hand: [W1] }, { characters: [V.c6] });
    g.act({ type: 'trigger', activate: true });
    const target = g.find('p2', 'characters', V.c6);
    pick(g, [target]);
    expect(g.card(target).rested).toBe(true);
    // The Trigger does not play the card, so its [On Play] never runs.
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([W1]);
  });

  it('[Trigger]: cost 7 is not a candidate', () => {
    const g = damageGame(ID, { leader: PLAIN_PURPLE }, {});
    g.act({ type: 'trigger', activate: true });
    // The attacker (cost 7) is the only opposing Character.
    expectDecision(g, 'main', 'p2');
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(true);
  });
});
