/** EB04-055 Bartholomew Kuma: [On K.O.] play up to 1 {Revolutionary Army} Character with a cost of 4 or less from your hand; [Trigger] if your Leader has {Revolutionary Army} and you and your opponent have a total of 5 or less Life cards, play this card. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, PLAIN_BLUE, pick, V } from './helpers.ts';
import {
  attackP1Leader,
  canPick,
  ids,
  koedInBattle,
  OTHER_LEADER,
  REV2,
  REV4,
  REV5,
  REV_LEADER,
} from './helpers-eb04g2.ts';
import { endCounter, passBlock } from './helpers.ts';

const ID = 'EB04-055';

/** p2 hits p1's Leader; p1's top Life card is Kuma (its [Trigger]); p1 has `own - 1` Life left after the hit. */
function hit(leader: string, own: number, opp: number) {
  const life = [ID, ...Array(own - 1).fill(V.c1)] as string[];
  const g = game(
    { leader, life },
    { leader: PLAIN_BLUE, characters: [V.c7], life: Array(opp).fill(V.c2) as string[] },
    { turn: 4, activePlayer: 'p2' },
  );
  attackP1Leader(g);
  passBlock(g);
  endCounter(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}

describe('EB04-055 Bartholomew Kuma', () => {
  it('[On K.O.] plays a {Revolutionary Army} Character with cost 4 or less from the hand; cost 5 and other types are not offered', () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER, hand: [REV2, REV4, REV5, V.c3] });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', REV2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', REV4))).toBe(true); // cost 4 is the limit
    expect(canPick(g, g.find('p1', 'hand', REV5))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false);
    pick(g, [g.find('p1', 'hand', REV4)]);
    expect(ids(g, 'p1', 'characters')).toEqual([REV4]);
  });

  it('[On K.O.] "up to 1": may play nothing', () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER, hand: [REV2] });
    none(g);
    expect(ids(g, 'p1', 'hand')).toEqual([REV2]);
  });

  it('[Trigger] {Revolutionary Army} Leader and a total of 5 Life left: play this card', () => {
    const g = hit(REV_LEADER, 3, 3); // 2 left after the hit + 3 = 5
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('[Trigger] boundary: a total of 6 Life left does not play it', () => {
    const g = hit(REV_LEADER, 4, 3); // 3 left after the hit + 3 = 6
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('[Trigger] without a {Revolutionary Army} Leader it is not played', () => {
    const g = hit(OTHER_LEADER, 2, 1);
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Trigger] counts both players: your own Life alone being low is not enough', () => {
    const g = hit(REV_LEADER, 2, 5); // 1 left + 5 = 6
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });
});
