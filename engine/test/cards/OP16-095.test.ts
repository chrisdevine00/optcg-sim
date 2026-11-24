/** OP16-095 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { game, none, pick, play, PLAIN_BLUE } from './helpers.ts';
import { BLACK_8000, WANO_BLACK, WANO_GREEN_1 } from './helpers-op16g4.ts';

const ID = 'OP16-095';

const start = (chars: string[]) =>
  game(
    { leader: PLAIN_BLUE, hand: [ID], characters: chars, costArea: { active: 2, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('OP16-095 Monkey.D.Luffy', () => {
  it('[On Play] a black {Land of Wano} Character gains [Unblockable] during this turn', () => {
    const g = start([WANO_BLACK]);
    play(g, ID);
    pick(g, [g.find('p1', 'characters', WANO_BLACK)]);
    expect(g.card(g.find('p1', 'characters', WANO_BLACK)).keywords).toContain('Unblockable');
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', WANO_BLACK)).keywords).not.toContain('Unblockable');
  });

  it('Luffy himself is a black {Land of Wano} Character and can take it', () => {
    const g = start([]);
    play(g, ID);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Unblockable');
  });

  it('must not fire on a green {Land of Wano} or a black non-Wano Character', () => {
    const g = start([WANO_GREEN_1, BLACK_8000]);
    play(g, ID);
    // Only Luffy qualifies among the three Characters.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    none(g);
    expect(g.card(g.find('p1', 'characters', WANO_GREEN_1)).keywords).not.toContain('Unblockable');
    expect(g.card(g.find('p1', 'characters', BLACK_8000)).keywords).not.toContain('Unblockable');
  });

  it('"up to 1": may choose nothing', () => {
    const g = start([WANO_BLACK]);
    play(g, ID);
    none(g);
    expect(g.card(g.find('p1', 'characters', WANO_BLACK)).keywords).not.toContain('Unblockable');
  });
});
