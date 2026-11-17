/** OP14-114 Ran. */
import { describe, expect, it } from 'vitest';
import { don, game, pick, PLAIN_BLUE, V } from './helpers.ts';
import { HANCOCK, KUJA, ROSI } from './helpers-hancock-rosi.ts';
import { damageWith } from './triggers.ts';

describe('OP14-114 Ran', () => {
  const start = (rested: number) =>
    game(
      {
        leader: HANCOCK,
        characters: ['OP14-114', KUJA, V.c1],
        costArea: { active: 0, rested },
      },
      { leader: PLAIN_BLUE },
    );
  const use = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', 'OP14-114'), ability: 'give' });

  it('[Activate: Main] gives 1 rested DON!! to a {Kuja Pirates} Leader or Character', () => {
    const g = start(2);
    use(g);
    // Candidates: the Leader, Ran and the Kuja Character, not the other Character.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.find('p1', 'characters', KUJA)]);
    expect(g.card(g.find('p1', 'characters', KUJA)).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 1, active: 0 });
  });

  it('can give it to the Leader', () => {
    const g = start(1);
    use(g);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('is once per turn', () => {
    const g = start(2);
    use(g);
    pick(g, [g.leader('p1')]);
    expect(g.legal().some((a) => a.type === 'activate' && a.ability === 'give')).toBe(false);
  });

  it('with no rested DON!! in the cost area it gives nothing', () => {
    const g = game(
      { leader: HANCOCK, characters: ['OP14-114'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    use(g as never);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(don(g, 'p1').active).toBe(2);
  });

  it('[Trigger] with a {Kuja Pirates} Leader plays this card', () => {
    const g = damageWith('OP14-114', { leader: HANCOCK });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP14-114']);
  });

  it('[Trigger] without a {Kuja Pirates} Leader does not play it', () => {
    const g = damageWith('OP14-114', { leader: ROSI });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['OP14-114']);
  });
});
