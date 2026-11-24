/** OP14-117 Brick Bat. */
import { describe, expect, it } from 'vitest';
import { endCounter, expectDecision, none, pick, V } from './helpers.ts';
import {
  counterGame,
  describeTbpTrigger,
  OTHER_LEADER,
  TBP4,
  TBP_LEADER,
} from './helpers-op14g4.ts';

const ID = 'OP14-117';
const offered = (g: ReturnType<typeof counterGame>) =>
  g
    .legal()
    .filter((a) => a.type === 'pick')
    .map((a) => (a.type === 'pick' ? a.choice : null));

describe('OP14-117 Brick Bat', () => {
  it('[Counter] a {Thriller Bark Pirates} Leader gains +3000 power during this battle', () => {
    const g = counterGame(ID, { leader: TBP_LEADER });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    // 8000 beats the 7000 attacker: no damage.
    expect(g.life('p1')).toBe(3);
  });

  it('a {Thriller Bark Pirates} Character may take the bonus; other Characters and a non-matching Leader are not offered', () => {
    const g = counterGame(ID, { leader: OTHER_LEADER, characters: [TBP4, V.c1] });
    const o = offered(g);
    expect(o).toEqual([g.find('p1', 'characters', TBP4)]);
    pick(g, [g.find('p1', 'characters', TBP4)]);
    expect(g.power(g.find('p1', 'characters', TBP4))).toBe(9000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = counterGame(ID, { leader: TBP_LEADER });
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with no {Thriller Bark Pirates} Leader or Character nothing can be chosen', () => {
    const g = counterGame(ID, { leader: OTHER_LEADER, characters: [V.c1] });
    expect(offered(g)).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describeTbpTrigger(ID);
