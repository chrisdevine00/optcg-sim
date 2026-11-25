/** ST21-012 Brook. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { BLUE, expectDecision, option, pick } from './helpers.ts';
import { attack, finishBattle, mk, offered } from './helpers-st1821.ts';

const ID = 'ST21-012';

const start = (rested = 3) => mk({ characters: [ID, BLUE], costArea: { active: 3, rested } });

describe('ST21-012 Brook', () => {
  it('[When Attacking]: gives up to 2 rested DON!! (a count is asked) to the Leader or 1 Character', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.map((o) => o.id)).toEqual(['2', '1', '0']);
    option(g, '2');
    // The Leader, Brook and the other Character.
    expect(offered(g)).toHaveLength(3);
    pick(g, [g.leader('p1')]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 1, given: 2 });
    expect(g.card(g.leader('p1')).don).toBe(2);
    finishBattle(g);
  });

  it('"up to 2": 1 may be given to a Character, 0 gives nothing', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    option(g, '1');
    pick(g, [g.find('p1', 'characters', BLUE)]);
    expect(g.card(g.find('p1', 'characters', BLUE)).don).toBe(1);
    finishBattle(g);
    const h = start();
    attack(h, h.find('p1', 'characters', ID));
    option(h, '0');
    expect(queries.don(h.state, 'p1')).toMatchObject({ rested: 3, given: 0 });
  });

  it('may give the DON!! to Brook himself, who then has +1000 per DON!!', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    option(g, '2');
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it('with no rested DON!! nothing is given and the attack goes on (active DON!! are never given)', () => {
    const g = start(0);
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'block', 'p2');
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 3, given: 0 });
  });

  it('is a [When Attacking] only: no ability is offered in the Main Phase', () => {
    const g = start();
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });
});
