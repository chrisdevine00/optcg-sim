/** OP13-110 Stussy. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, PLAIN_PURPLE, V } from './helpers.ts';
import {
  canBlockWith,
  canPick,
  EGG_LEADER,
  mine,
  names,
  theirs,
  TRIG2,
  TRIG5,
} from './helpers-op13g4.ts';

const ID = 'OP13-110';
const TRIG6 = 'ST29-005';

describe('OP13-110 Stussy', () => {
  const run = (leader: string, hand: string[]) => {
    const g = mine({ leader, hand: [ID, ...hand] }, {}, 7);
    play(g, ID);
    return g;
  };

  it('[On Play] with an {Egghead} Leader: plays a cost 5 or less Character with a [Trigger] from hand', () => {
    const g = run(EGG_LEADER, [TRIG5, TRIG6, TRIG2, V.c1]);
    expect(canPick(g, g.find('p1', 'hand', TRIG5))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', TRIG2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', TRIG6))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'hand', TRIG5)]);
    expect(names(g, 'p1', 'characters').sort()).toEqual([ID, TRIG5].sort());
  });

  it('without {Egghead} nothing is asked or played', () => {
    const g = run(PLAIN_PURPLE, [TRIG5]);
    expect(dec(g)?.kind).toBe('main');
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"up to 1": may play nothing', () => {
    const g = run(EGG_LEADER, [TRIG5]);
    none(g);
    expect(names(g, 'p1', 'hand')).toEqual([TRIG5]);
  });

  it('only a Character with a [Trigger] (a plain Character is not offered); with none nothing happens', () => {
    const g = run(EGG_LEADER, [V.c1, V.c2]);
    if (dec(g)?.kind === 'choose') none(g);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('has printed [Blocker]', () => {
    const g = theirs({ leader: EGG_LEADER, characters: [ID] }, { characters: [V.c7] });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });
});
