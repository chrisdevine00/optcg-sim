/** EB05-059 Charlotte Pudding!!: [Main] Draw 1 card, and all of your Characters with 4000 base power and the {Big Mom Pirates} type cannot be K.O.'d in battle until the end of your opponent's next End Phase. [Trigger] Draw 1 card and play up to 1 Character card with 4000 power and a [Trigger] from your hand. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { battle } from './helpers-hancock-rosi.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { BMP, BMP6, TRIG, TRIG5, ids, triggerHit } from './helpers-robin.ts';

const PUDDING = 'EB05-059';

describe('EB05-059 Charlotte Pudding!!', () => {
  /** p1 plays the Event with the given rested Characters, then passes the turn so p2 (7000 attacker) can attack. */
  const protectedBoard = (chars: string[]) => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: [PUDDING],
        characters: chars.map((card) => ({ card, rested: true })),
        deck: [BLUE, BLUE, BLUE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c7, V.c7] },
    );
    play(g, PUDDING);
    g.act({ type: 'endTurn' });
    return g;
  };

  it('[Main] draws 1 card', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: [PUDDING],
        deck: [BLUE, BLUE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, PUDDING);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('[Main] a 4000 base power {Big Mom Pirates} Character is not K.O.d in battle on the opponent turn', () => {
    const g = protectedBoard([TRIG]);
    battle(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', TRIG));
    expect(ids(g, 'p1', 'characters')).toEqual([TRIG]);
    expect(g.eventsOfType('KO')).toHaveLength(0);
  });

  it('[Main] covers every matching Character (all of them), not just one', () => {
    const g = protectedBoard([TRIG, BMP]);
    battle(g, g.find('p2', 'characters', V.c7, 0), g.find('p1', 'characters', TRIG));
    battle(g, g.find('p2', 'characters', V.c7, 1), g.find('p1', 'characters', BMP));
    expect(ids(g, 'p1', 'characters').sort()).toEqual([BMP, TRIG].sort());
  });

  it('[Main] does not protect a Big Mom Pirates Character with other base power, or another type with 4000', () => {
    const g = protectedBoard([BMP6, V.c2]);
    battle(g, g.find('p2', 'characters', V.c7, 0), g.find('p1', 'characters', BMP6));
    battle(g, g.find('p2', 'characters', V.c7, 1), g.find('p1', 'characters', V.c2));
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Main] "in battle" only: the protected Character can still be K.O.\'d by an opponent\'s effect', () => {
    const g = protectedBoard([TRIG]);
    plantOpponentEffect(g, { ko: { from: 'characters', owner: 'opponent' } });
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Trigger] draws 1 and plays a Character with 4000 power and a [Trigger] from hand', () => {
    const g = triggerHit(PUDDING, { hand: [TRIG, TRIG5, BMP], deck: [BLUE, BLUE] });
    g.act({ type: 'trigger', activate: true });
    // Only TRIG has both 4000 power and a [Trigger]: TRIG5 is 5000, BMP has no [Trigger].
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', TRIG)]);
    expect(ids(g, 'p1', 'characters')).toEqual([TRIG]);
    expect(hand(g, 'p1')).toHaveLength(3);
    expectDecision(g, 'main', 'p2');
  });
});
