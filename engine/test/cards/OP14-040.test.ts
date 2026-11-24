/** OP14-040 Jinbe (Leader). */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, don, expectDecision, hand, pick, trash, V } from './helpers.ts';
import { canActivate, canPick, FM3, mine, MER3, names } from './helpers-op14g2.ts';

const ID = 'OP14-040';

const start = (rested: number, handCards: string[] = [V.c1]) =>
  mine(ID, {
    hand: handCards,
    characters: [FM3, MER3, V.c2],
    costArea: { active: 1, rested },
  });
const use = (g: ReturnType<typeof start>) =>
  g.act({ type: 'activate', card: g.leader('p1'), ability: 'give' });

describe('OP14-040 Jinbe', () => {
  it('trash 1 card from hand: gives 2 rested DON!! to a {Fish-Man} Character', () => {
    const g = start(3);
    use(g);
    pick(g, [g.find('p1', 'hand', V.c1)]); // the cost
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expectDecision(g, 'choose', 'p1');
    // The count may come first or the target: answer whatever is asked.
    for (let i = 0; i < 3 && dec(g)?.kind === 'choose'; i++) {
      const d = dec(g)!;
      if (d.options?.length) g.act({ type: 'pick', choice: { option: d.options[0]!.id } });
      else pick(g, [g.find('p1', 'characters', FM3)]);
    }
    expect(g.card(g.find('p1', 'characters', FM3)).don).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
  });

  it('{Merfolk} Characters and the Leader are legal targets; a Character of neither type is not', () => {
    const g = start(3);
    use(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    // Skip a possible count prompt.
    const d = dec(g)!;
    if (d.options?.length) g.act({ type: 'pick', choice: { option: d.options[0]!.id } });
    expect(canPick(g, g.leader('p1'))).toBe(true); // {Fish-Man} Leader
    expect(canPick(g, g.find('p1', 'characters', FM3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', MER3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
  });

  it('only rested DON!! are given: active DON!! stay', () => {
    const g = start(1);
    use(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    for (let i = 0; i < 3 && dec(g)?.kind === 'choose'; i++) {
      const d = dec(g)!;
      if (d.options?.length) g.act({ type: 'pick', choice: { option: d.options[0]!.id } });
      else pick(g, [g.leader('p1')]);
    }
    expect(g.card(g.leader('p1')).don).toBe(1); // only 1 rested DON!! existed
    expect(don(g, 'p1').active).toBe(1);
  });

  it('cannot be activated with an empty hand (the cost is unpayable)', () => {
    const g = start(3, []);
    expect(canActivate(g, g.leader('p1'), 'give')).toBe(false);
  });

  it('the trashed card is the one chosen; the others stay', () => {
    const g = start(3, [V.c1, BLUE]);
    use(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(names(g, 'p1', 'trash')).toEqual([BLUE]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });
});
