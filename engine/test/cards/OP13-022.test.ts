/** OP13-022 Windmill Village. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import { canActivate } from './helpers-op16g1.ts';
import { boost, mk, ONE_THOUSAND, P2000 } from './helpers-op13g1.ts';

const ID = 'OP13-022';

describe('OP13-022 Windmill Village', () => {
  const start = (chars: string[] = [P2000, V.c1], stage: string = ID) =>
    mk({ stage, characters: chars });
  const act = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'activate', card: g.zone('p1', 'stage')[0]!.instance, ability: 'main' });

  it('[Activate: Main]: rests the Stage; up to 1 of your Characters with 2000 base power or less gains +1000 power this turn', () => {
    const g = start();
    act(g);
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    pick(g, [g.find('p1', 'characters', P2000)]);
    expect(g.power(g.find('p1', 'characters', P2000))).toBe(3000);
  });

  it('boundary: base power 2000 qualifies, 3000 does not (only one candidate is offered)', () => {
    const g = start([P2000, V.c1]);
    act(g);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'characters', P2000)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
  });

  it('reads BASE power: a 1000 base Character boosted above 2000 still qualifies; a 3000 base one lowered below 2000 does not', () => {
    const g = start([ONE_THOUSAND, V.c1]);
    boost(g, g.find('p1', 'characters', ONE_THOUSAND), 2000); // 3000 now
    boost(g, g.find('p1', 'characters', V.c1), -2000); // 1000 now
    act(g);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'characters', ONE_THOUSAND)]);
    expect(g.power(g.find('p1', 'characters', ONE_THOUSAND))).toBe(4000);
  });

  it('only Characters: your Leader is not a candidate; with no Character the cost is still paid', () => {
    const g = start([V.c1]);
    act(g);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may choose nothing; a rested Stage cannot be activated again', () => {
    const g = start();
    act(g);
    none(g);
    expect(g.power(g.find('p1', 'characters', P2000))).toBe(2000);
    expect(canActivate(g, g.zone('p1', 'stage')[0]!.instance, 'main')).toBe(false);
  });

  it('the bonus lasts this turn only', () => {
    const g = start();
    act(g);
    pick(g, [g.find('p1', 'characters', P2000)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', P2000))).toBe(2000);
  });
});
