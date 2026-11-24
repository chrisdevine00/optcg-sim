/** EB05-005 Belo Betty. */
import { describe, expect, it } from 'vitest';
import { game, none, pick, play, PLAIN_BLUE, PLAIN_PURPLE, trash, V } from './helpers.ts';
import { MONET } from './helpers-hancock-rosi.ts';

const ID = 'EB05-005';
/** {Revolutionary Army} Characters with a [Trigger]: Kuma 5000, Belo Betty 4000, Lindbergh 4000, Karasu 4000. */
const RA = ['OP09-108', 'OP09-112', 'OP09-114', 'OP09-100'] as const;
/** {Revolutionary Army} Character without a [Trigger]: Morley 6000. */
const MORLEY = 'OP09-113';

describe('EB05-005 Belo Betty', () => {
  const onPlay = (chars: string[]) =>
    game(
      { leader: PLAIN_PURPLE, hand: [ID], characters: chars, costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: up to 3 of your {Revolutionary Army} Characters with a [Trigger] gain +2000 power during this turn', () => {
    const g = onPlay([...RA]);
    play(g, ID);
    // 4 qualify (Belo Betty herself has no [Trigger]): choose 3.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(4);
    const three = RA.slice(0, 3).map((c) => g.find('p1', 'characters', c));
    pick(g, three);
    expect(three.map((c) => g.power(c))).toEqual([7000, 6000, 6000]);
    expect(g.power(g.find('p1', 'characters', RA[3]))).toBe(4000);
    // Only this turn.
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(three.map((c) => g.power(c))).toEqual([5000, 4000, 4000]);
  });

  it('a {Revolutionary Army} Character without a [Trigger] and a Trigger Character of another type are not candidates', () => {
    const g = onPlay([MORLEY, MONET, RA[0]]);
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'characters', RA[0])]);
    expect(g.power(g.find('p1', 'characters', MORLEY))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', MONET))).toBe(3000);
  });

  it('"up to": may choose none', () => {
    const g = onPlay([RA[0]]);
    play(g, ID);
    none(g);
    expect(g.power(g.find('p1', 'characters', RA[0]))).toBe(5000);
  });

  describe('[Activate: Main] You may trash this Character: -2000 power', () => {
    const active = () =>
      game(
        { leader: PLAIN_PURPLE, characters: [ID] },
        { leader: PLAIN_BLUE, characters: [V.c4, V.c1] },
      );

    it("trashes this Character and gives up to 1 of your opponent's Characters -2000 power during this turn", () => {
      const g = active();
      g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'debuff' });
      // Only Characters are candidates, not the Leader.
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
      const target = g.find('p2', 'characters', V.c4);
      pick(g, [target]);
      expect(g.power(target)).toBe(4000);
      expect(trash(g, 'p1')).toEqual([ID]);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      g.act({ type: 'endTurn' });
      expect(g.power(target)).toBe(6000);
    });

    it('has no rest cost: a rested Belo Betty can still be trashed for the effect', () => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [{ card: ID, rested: true }] },
        { leader: PLAIN_BLUE, characters: [V.c4] },
      );
      expect(
        g.isLegal({
          type: 'activate',
          card: g.find('p1', 'characters', ID),
          ability: 'debuff',
          player: 'p1',
        }),
      ).toBe(true);
    });

    it('with no opposing Character the cost is still paid and nothing happens', () => {
      const g = game({ leader: PLAIN_PURPLE, characters: [ID] }, { leader: PLAIN_BLUE });
      g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'debuff' });
      expect(trash(g, 'p1')).toEqual([ID]);
      expect(g.power(g.leader('p2'))).toBe(5000);
    });
  });
});
