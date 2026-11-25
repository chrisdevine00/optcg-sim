/** OP10-090 Franky. */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  DRESS2,
  DRESS3,
  DRESS5,
  expectDecision,
  idsOf,
  koBy,
  koedInBattle,
  mk,
  none,
  OTHER_LEADER,
  pick,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-090';
const trashed = [DRESS5, DRESS3, V.c1, DRESS2];
const start = () => mk({ characters: [ID], trash: trashed });

describe('OP10-090 Franky', () => {
  it('has [Blocker]', () => {
    const g = start();
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On K.O.] plays a Dressrosa Character with cost 3 or less from the trash, rested', () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'trash', DRESS2))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', DRESS3))).toBe(true); // cost 3 boundary
    expect(canPick(g, g.find('p1', 'trash', DRESS5))).toBe(false); // cost 5
    expect(canPick(g, g.find('p1', 'trash', V.c1))).toBe(false); // not Dressrosa
    pick(g, [g.find('p1', 'trash', DRESS3)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([DRESS3]);
    expect(g.card(g.find('p1', 'characters', DRESS3)).rested).toBe(true);
  });

  it("works when it is K.O.'d in battle", () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER, trash: trashed });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'trash', DRESS2)]);
    expect(g.card(g.find('p1', 'characters', DRESS2)).rested).toBe(true);
  });

  it('"up to 1": may play nothing', () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    none(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('must not play anything when the trash holds no eligible Dressrosa Character', () => {
    const g = mk({ characters: [ID], trash: [DRESS5, V.c1] });
    koBy(g, 'p1', ID, 'p2');
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });
});
