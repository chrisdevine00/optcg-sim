/** OP16-081 Otama. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import { NOT_NAVY, WANO_8 } from './helpers-op16g3.ts';

const ID = 'OP16-081';
const start = (mine: string[]) =>
  game({ leader: NOT_NAVY, characters: [ID, ...mine] }, { leader: PLAIN_BLUE, characters: [V.c4] });
const use = (g: ReturnType<typeof start>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'shrink' });

describe('OP16-081 Otama', () => {
  it('[Activate: Main] rest this Character: with a cost 8 Character, an opponent Character gets -2000 power', () => {
    const g = start([WANO_8]);
    use(g);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(4000);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('a Character with cost 7 is not enough: the cost is paid and nothing happens', () => {
    const g = start([V.c7]);
    use(g);
    // No target is asked for (a pick would still be pending if cost 7 counted), and no power moved.
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('the boundary: a cost 8 Character asks for the target, a cost 7 one does not', () => {
    const at8 = start([WANO_8]);
    use(at8);
    expectDecision(at8, 'choose', 'p1');
    const at7 = start([V.c7]);
    use(at7);
    expectDecision(at7, 'main', 'p1');
  });

  it('Otama herself (cost 2) does not satisfy the condition', () => {
    const g = start([]);
    use(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('"up to 1": may choose nobody', () => {
    const g = start([WANO_8]);
    use(g);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('cannot be activated while rested (the rest cost cannot be paid)', () => {
    const g = game(
      { leader: NOT_NAVY, characters: [{ card: ID, rested: true }, WANO_8] },
      { leader: PLAIN_BLUE, characters: [V.c4] },
    );
    expect(
      g.isLegal({
        type: 'activate',
        card: g.find('p1', 'characters', ID),
        ability: 'shrink',
        player: 'p1',
      }),
    ).toBe(false);
  });
});
