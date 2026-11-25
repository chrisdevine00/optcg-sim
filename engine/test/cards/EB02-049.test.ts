/** EB02-049 Monkey.D.Garp. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, option, pick, play } from './helpers.ts';
import {
  activate,
  canActivate,
  canPick,
  GARP_LEADER,
  ids,
  mk,
  OTHER_LEADER,
  V,
} from './helpers-aeb2g2.ts';

const ID = 'EB02-049';
// 5 active DON!! pay the cost; the 5 rested ones are given.
const onPlay = (rested: number, leader = OTHER_LEADER) => {
  const g = mk({ leader, hand: [ID], costArea: { active: 5, rested } });
  play(g, ID);
  return g;
};
const onField = (leader: string, p2chars: string[] = [V.c1, V.c2]) =>
  mk({ leader, characters: [ID] }, { characters: p2chars });

describe('EB02-049 Monkey.D.Garp', () => {
  it('[On Play] gives up to 2 rested DON!! to your Leader (a count is asked, most first)', () => {
    const g = onPlay(1);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['2', '1', '0']);
    addMost(g);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ rested: 4 });
  });

  it('"up to 2": 1 or none can be chosen', () => {
    const g = onPlay(1);
    option(g, '1');
    expect(g.card(g.leader('p1')).don).toBe(1);
    const h = onPlay(1);
    option(h, '0');
    expect(h.card(h.leader('p1')).don).toBe(0);
  });

  it('the DON!! go to the Leader, not to the Character: Garp itself has none', () => {
    const g = onPlay(1);
    addMost(g);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(0);
  });

  it('[Activate: Main] rests Garp and, with a [Monkey.D.Garp] Leader, K.O.s a Character with cost 1 or less', () => {
    const g = onField(GARP_LEADER);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c2]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c1]);
  });

  it('must not K.O. with another Leader: the rest cost is paid and nothing is asked', () => {
    const g = onField(OTHER_LEADER);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1, V.c2]);
  });

  it('"up to 1": may K.O. nothing; and the ability is not offered while Garp is rested', () => {
    const g = onField(GARP_LEADER);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'choose', 'p1');
    g.act({ type: 'done' });
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1, V.c2]);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});
