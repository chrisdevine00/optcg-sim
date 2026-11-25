/** OP15-093 The Risky Brothers (Character, cost 1, 2000, <Slash>). */
import { describe, expect, it } from 'vitest';
import { withAbilities } from '../../src/testing.ts';
import {
  BLUE,
  dec,
  game,
  hand,
  none,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  times,
  trash,
} from './helpers.ts';
import { main } from './m6b-w1/probe.ts';
import { LUFFY } from './helpers-w7c2.ts';

const ID = 'OP15-093';

/** A probe on BLUE: draw 1 if one of your [Monkey.D.Luffy] Characters has the <Slash> attribute. */
const slashLuffy = main([
  {
    if: {
      exists: {
        from: 'characters',
        owner: 'you',
        filter: { all: [{ name: 'Monkey.D.Luffy' }, { attribute: 'Slash' }] },
      },
    },
    then: [{ do: { draw: 1 } }],
  },
] as never);

describe('OP15-093 The Risky Brothers [Activate: Main]', () => {
  /** `others` cards in the trash besides the Risky Brothers, which is trashed as the cost. */
  const start = (others: number, characters: string[] = [ID, LUFFY, BLUE]) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters, trash: times(others, BLUE) },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [slashLuffy]);
    return g;
  };
  const use = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'grant' });
  const luffy = (g: ReturnType<typeof start>) => g.card(g.find('p1', 'characters', LUFFY));
  const probe = (g: ReturnType<typeof start>) => {
    const before = hand(g, 'p1').length;
    g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
    return hand(g, 'p1').length - before;
  };

  it('with 15 cards in the trash a [Monkey.D.Luffy] gains [Rush: Character] and the Slash attribute', () => {
    const g = start(14); // 14 + this card = 15: the boundary
    use(g);
    expect(dec(g)!.kind).toBe('choose');
    pick(g, [g.find('p1', 'characters', LUFFY)]);
    expect(trash(g, 'p1')).toHaveLength(15);
    expect(luffy(g).keywords).toContain('Rush: Character');
    expect(probe(g)).toBe(1);
  });

  it('with 14 cards in the trash (itself included) nothing happens, but it is still trashed', () => {
    const g = start(13);
    use(g);
    expect(dec(g)?.kind).toBe('main');
    expect(trash(g, 'p1')).toHaveLength(14);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([LUFFY, BLUE]);
    expect(luffy(g).keywords).not.toContain('Rush: Character');
    expect(probe(g)).toBe(0);
  });

  it('"up to 1": may choose nobody', () => {
    const g = start(20);
    use(g);
    none(g);
    expect(luffy(g).keywords).not.toContain('Rush: Character');
    expect(probe(g)).toBe(0);
  });

  it('only a [Monkey.D.Luffy] can be chosen: another Character is not offered', () => {
    const g = start(20);
    use(g);
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered).toEqual([g.find('p1', 'characters', LUFFY)]);
  });

  it('with no [Monkey.D.Luffy] on the field the cost is paid and nothing else happens', () => {
    const g = start(20, [ID, BLUE]);
    use(g);
    if (dec(g)?.kind === 'choose') none(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BLUE]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('it lasts the turn only', () => {
    const g = start(20);
    use(g);
    pick(g, [g.find('p1', 'characters', LUFFY)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(luffy(g).keywords).not.toContain('Rush: Character');
  });
});
