/** OP14-086 Miss Doublefinger(Zala). */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { BW4, BW5, BW_LEADER, game, PLAIN_BLUE, plantOn, rep } from './helpers-op14g3.ts';

const ID = 'OP14-086';

describe('OP14-086 Miss Doublefinger(Zala)', () => {
  const start = (trashN: number, chars: string[] = [BW4, V.c1]) =>
    game(
      { leader: BW_LEADER, characters: [ID, ...chars], trash: rep(trashN, V.c1) },
      { leader: PLAIN_BLUE, characters: [BW5] },
    );
  const self = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);

  it('with 7 cards in your trash: +1000 power and all your Baroque Works Characters gain +2 cost', () => {
    const g = start(7);
    expect(g.power(self(g))).toBe(7000);
    expect(g.card(g.find('p1', 'characters', BW4)).cost).toBe(6);
  });

  it('with 6 cards in your trash neither applies (boundary)', () => {
    const g = start(6);
    expect(g.power(self(g))).toBe(6000);
    expect(g.card(g.find('p1', 'characters', BW4)).cost).toBe(4);
    expect(g.card(self(g)).cost).toBe(5);
  });

  it('it is a Baroque Works Character itself: its own cost rises by 2', () => {
    const g = start(7);
    expect(g.card(self(g)).cost).toBe(7);
  });

  it('only Characters with a type including Baroque Works: others and the opponent’s do not gain cost', () => {
    const g = start(7);
    expect(g.card(g.find('p1', 'characters', V.c1)).cost).toBe(1);
    expect(g.card(g.find('p2', 'characters', BW5)).cost).toBe(5);
  });

  it('is live: it starts to apply the moment the trash reaches 7', () => {
    const g = game(
      { leader: BW_LEADER, characters: [ID, V.c1], trash: rep(6, V.c1), deck: rep(5, V.c2) },
      { leader: PLAIN_BLUE },
    );
    expect(g.power(self(g))).toBe(6000);
    plantOn(g, g.find('p1', 'characters', V.c1), [{ do: { mill: { player: 'you', n: 1 } } }]);
    expect(g.zone('p1', 'trash')).toHaveLength(7);
    expect(g.power(self(g))).toBe(7000);
  });
});
