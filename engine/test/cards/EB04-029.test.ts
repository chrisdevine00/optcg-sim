/** EB04-029 I Heard the Sound...of a Lady's Teardrops Falling: [Main] Sanji Leader: look at 3, add [Sanji] or Event, trash the rest; [Counter] trash 1: [Sanji] +4000. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  expectDecision,
  none,
  passBlock,
  pick,
  play,
  takeDamage,
  V,
} from './helpers.ts';
import {
  canPick,
  EVENT,
  ids,
  mine,
  OTHER_LEADER,
  SANJI1,
  SANJI8,
  SANJI_LEADER,
} from './helpers-eb04g2.ts';
import { game, PLAIN_BLUE } from './helpers.ts';

const ID = 'EB04-029';

const mainGame = (leader: string, deck: string[]) =>
  mine({ leader, hand: [ID], deck: [...deck, ...Array(7).fill(V.c1)] });

/** p2 attacks p1's `target` (Leader by default) with a 9000 Character; p1 stops at the counter step. */
function counterGame(characters: string[], hand: string[]) {
  const g = game(
    { leader: SANJI_LEADER, hand: [ID, ...hand], characters, costArea: { active: 4, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  if (dec(g)?.kind === 'optional') g.act({ type: 'optional', accept: false });
  passBlock(g);
  return g;
}

describe('EB04-029 I Heard the Sound...of a Lady Teardrops Falling', () => {
  it('[Main] with [Sanji] as Leader: look at 3, add a [Sanji] (or an Event), trash the rest', () => {
    const g = mainGame(SANJI_LEADER, [V.c2, SANJI1, EVENT]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', SANJI1))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', EVENT))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c2))).toBe(false);
    pick(g, [g.find('p1', 'deck', SANJI1)]);
    expect(ids(g, 'p1', 'hand')).toEqual([SANJI1]);
    expect(ids(g, 'p1', 'trash').sort()).toEqual([EVENT, ID, V.c2].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(7);
  });

  it('[Main] "up to 1": taking nothing trashes all three looked cards', () => {
    const g = mainGame(SANJI_LEADER, [SANJI1, EVENT, SANJI8]);
    play(g, ID);
    none(g);
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toHaveLength(4);
  });

  it('[Main] only the top 3 are looked at: a [Sanji] fourth from the top stays', () => {
    const g = mainGame(SANJI_LEADER, [V.c2, V.c3, V.c4, SANJI1]);
    play(g, ID);
    if (dec(g)?.kind === 'choose') none(g);
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });

  it('[Main] without [Sanji] as Leader nothing is looked at', () => {
    const g = mainGame(OTHER_LEADER, [SANJI1, EVENT, V.c2]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'deck')).toHaveLength(10);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('[Counter] trash 1: your [Sanji] Character gains +4000 during this battle', () => {
    const g = counterGame([SANJI1], [V.c1]);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', SANJI1))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(true); // the Leader is a [Sanji] card
    pick(g, [g.find('p1', 'characters', SANJI1)]);
    expect(g.power(g.find('p1', 'characters', SANJI1))).toBe(7000);
    expect(ids(g, 'p1', 'trash')).toContain(V.c1);
  });

  it('[Counter] the +4000 ends with the battle', () => {
    const g = counterGame([], [V.c1]);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    g.act({ type: 'endCounter' });
    takeDamage(g); // the Life card hit has a [Trigger]: decline it
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter] only [Sanji] cards are offered; the cost can be declined', () => {
    const g = counterGame([V.c2], [V.c1]);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(ids(g, 'p1', 'hand')).toEqual([V.c1]);
  });
});
