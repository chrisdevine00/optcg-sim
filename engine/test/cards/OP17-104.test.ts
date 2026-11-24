/** OP17-104 Charlotte Cracker. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  payDon,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { triggerHit } from './helpers-robin.ts';
import { LINLIN } from './helpers-op17g3.ts';

const ID = 'OP17-104';
const start = (leader: string, active = 5) =>
  game(
    {
      leader,
      hand: [ID],
      deck: [V.c1, V.c2, V.c3],
      life: [V.c5, V.c5],
      costArea: { active, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );

describe('OP17-104 Charlotte Cracker', () => {
  it('[Your Turn][On Play] rest 2 DON!!: with a {Big Mom Pirates} Leader, adds the top deck card to your Life', () => {
    const g = start(LINLIN);
    play(g, ID);
    accept(g);
    payDon(g);
    accept(g); // "add up to 1"
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c1);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
  });

  it('"up to 1": the Life card may be declined (the 2 DON!! stay rested)', () => {
    const g = start(LINLIN);
    play(g, ID);
    accept(g);
    payDon(g);
    decline(g);
    expect(g.life('p1')).toBe(2);
    expect(don(g, 'p1').rested).toBe(5);
  });

  it('with another Leader type the 2 DON!! are rested but no Life card is added', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    accept(g);
    payDon(g);
    expectDecision(g, 'main', 'p1');
    expect(g.life('p1')).toBe(2);
    expect(don(g, 'p1').rested).toBe(5);
  });

  it('declining the optional cost rests nothing and adds nothing', () => {
    const g = start(LINLIN);
    play(g, ID);
    decline(g);
    expect(g.life('p1')).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
  });

  it('[Trigger] play this card; on the opponent’s turn the [Your Turn] [On Play] does nothing', () => {
    const g = triggerHit(ID, {
      leader: LINLIN,
      deck: [V.c1, V.c2],
      costArea: { active: 3, rested: 0 },
    });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expectDecision(g, 'main', 'p2');
    expect(g.life('p1')).toBe(1);
    expect(don(g, 'p1').active).toBe(3);
  });
});
