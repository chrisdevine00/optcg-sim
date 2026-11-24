/** OP17-103 Charlotte Katakuri. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  expectDecision,
  game,
  none,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { triggerHit } from './helpers-robin.ts';
import { LINLIN } from './helpers-op17g3.ts';

const ID = 'OP17-103';
const start = (leader: string) =>
  game(
    {
      leader,
      hand: [ID],
      deck: [V.c1, V.c2, V.c3],
      life: [V.c5, V.c5],
      costArea: { active: 6, rested: 0 },
    },
    { leader: PLAIN_BLUE, characters: [V.c6] },
  );

describe('OP17-103 Charlotte Katakuri', () => {
  it('[Your Turn][On Play] with a {Big Mom Pirates} Leader: adds the top deck card to your Life, then −3000 power', () => {
    const g = start(LINLIN);
    play(g, ID);
    accept(g);
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c1);
    const target = g.find('p2', 'characters', V.c6);
    pick(g, [target]);
    expect(g.power(target)).toBe(5000);
  });

  it('"Then" is not "If you do": declining the Life card still gives the −3000', () => {
    const g = start(LINLIN);
    play(g, ID);
    decline(g);
    expect(g.life('p1')).toBe(2);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.power(g.find('p2', 'characters', V.c6))).toBe(5000);
  });

  it('"up to 1": may give the −3000 to nothing', () => {
    const g = start(LINLIN);
    play(g, ID);
    accept(g);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c6))).toBe(8000);
    expect(g.life('p1')).toBe(3);
  });

  it('without a {Big Mom Pirates} Leader nothing happens', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.life('p1')).toBe(2);
    expect(g.power(g.find('p2', 'characters', V.c6))).toBe(8000);
  });

  it('[Trigger] play this card; on the opponent’s turn the [Your Turn] [On Play] does nothing', () => {
    const g = triggerHit(ID, { leader: LINLIN, deck: [V.c1, V.c2] }, [V.c6]);
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expectDecision(g, 'main', 'p2');
    expect(g.life('p1')).toBe(1); // one Life card was left after the damage; none added
    expect(g.power(g.find('p2', 'characters', V.c6))).toBe(8000);
  });
});
