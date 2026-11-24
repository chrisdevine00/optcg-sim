/** OP17-038 I Think He's Seen an Ugly Future.... */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  none,
  PLAIN_BLUE,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import type { TestGame } from '../fixtures/index.ts';
import { OTHER_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-038';

/** Pay the cost: the Leader, both Characters and one DON!! card (exactly 4 of the 5 candidates). */
function rest4(g: TestGame): void {
  expectDecision(g, 'choose', 'p1');
  const want = new Set<string>([
    g.leader('p1'),
    g.find('p1', 'characters', V.c1),
    g.find('p1', 'characters', V.c2),
  ]);
  while (want.size) {
    const a = g
      .legal()
      .find((x) => x.type === 'pick' && typeof x.choice === 'string' && want.has(x.choice));
    if (!a || a.type !== 'pick') throw new Error('candidate missing');
    want.delete(a.choice as string);
    g.act(a);
  }
  g.act(g.legal().find((x) => x.type === 'pick')!);
}

describe("OP17-038 I Think He's Seen an Ugly Future...", () => {
  const start = () =>
    game(
      {
        leader: OTHER_LEADER,
        hand: [ID],
        characters: [V.c1, V.c2],
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c3, V.c4] },
    );

  it("[Main]: you may rest 4 of your cards: rest up to 1 of your opponent's Characters", () => {
    const g = start();
    play(g, ID);
    accept(g);
    // 5 cards can be rested (Leader, 2 Characters, 2 DON!!): rest the Leader, Characters and 1 DON!!.
    rest4(g);
    const t = g.find('p2', 'characters', V.c4);
    pick(g, [t]);
    expect(g.card(t).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('"up to 1": may rest nothing, the cost is still paid', () => {
    const g = start();
    play(g, ID);
    accept(g);
    rest4(g);
    none(g);
    expect(g.zone('p2', 'characters').some((c) => c.rested)).toBe(false);
  });

  it('declining the cost rests nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.zone('p1', 'characters').some((c) => c.rested)).toBe(false);
    expect(g.zone('p2', 'characters').some((c) => c.rested)).toBe(false);
  });

  it('with fewer than 4 restable cards the cost cannot be paid', () => {
    const g = game(
      { leader: OTHER_LEADER, hand: [ID], characters: [V.c1], costArea: { active: 0, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    play(g, ID);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  describe('[Counter]', () => {
    const step = () => counterStep({ leader: OTHER_LEADER, hand: [ID, BLUE], characters: [V.c1] });

    it('you may trash 1 card from your hand: up to 1 of your Leader or Characters gains +3000 power during this battle', () => {
      const g = step();
      useCounter(g, ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE)]);
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(8000);
      expect(trash(g, 'p1')).toContain(BLUE);
      endCounter(g);
    });

    it('declining the cost: no power, the card stays in hand', () => {
      const g = step();
      useCounter(g, ID);
      decline(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([BLUE]);
    });
  });
});
