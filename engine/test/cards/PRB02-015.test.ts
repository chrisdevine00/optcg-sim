/** PRB02-015 Shiryu. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, V } from './helpers.ts';
import { BLACKBEARD_LEADER, cardsIn, mk, PLAIN_PURPLE_LEADER } from './helpers-prbst.ts';
import { koBy } from './helpers-w3s.ts';
import { costMod } from './helpers-eb03g2.ts';

const ID = 'PRB02-015';

describe('PRB02-015 Shiryu', () => {
  const shiryu = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);

  it('with a {Blackbeard Pirates} Leader it gains [Blocker] and +4 cost', () => {
    const g = mk({ leader: BLACKBEARD_LEADER, characters: [ID] });
    expect(g.card(shiryu(g)).keywords).toContain('Blocker');
    expect(g.card(shiryu(g)).cost).toBe(8);
  });

  it('must not fire: with another Leader it has neither [Blocker] nor the cost increase', () => {
    const g = mk({ leader: PLAIN_PURPLE_LEADER, characters: [ID] });
    expect(g.card(shiryu(g)).keywords).not.toContain('Blocker');
    expect(g.card(shiryu(g)).cost).toBe(4);
  });

  it('[On K.O.]: with a {Blackbeard Pirates} Leader, K.O.s a Character with a base cost of 4 or less (5 is not a candidate)', () => {
    const g = mk({ leader: BLACKBEARD_LEADER, characters: [ID] }, { characters: [V.c4, V.c5] });
    koBy(g, 'p1', ID, 'p2');
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered).toEqual([g.find('p2', 'characters', V.c4)]);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c5]);
  });

  it('"up to 1": the K.O. may be skipped', () => {
    const g = mk({ leader: BLACKBEARD_LEADER, characters: [ID] }, { characters: [V.c4] });
    koBy(g, 'p1', ID, 'p2');
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('must not fire: [On K.O.] with another Leader K.O.s nothing', () => {
    const g = mk({ leader: PLAIN_PURPLE_LEADER, characters: [ID] }, { characters: [V.c4] });
    koBy(g, 'p1', ID, 'p2');
    expect(dec(g)?.kind).toBe('main');
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('"base cost": a base cost 5 Character lowered to 4 is not a candidate; a base cost 4 one raised to 6 is', () => {
    const g = mk({ leader: BLACKBEARD_LEADER, characters: [ID] }, { characters: [V.c5, V.c4] });
    costMod(g, g.find('p2', 'characters', V.c5), -1);
    costMod(g, g.find('p2', 'characters', V.c4), 2);
    koBy(g, 'p1', ID, 'p2');
    // Both are checked by their printed cost: only the base cost 4 Character qualifies.
    expect(
      g
        .legal()
        .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : [])),
    ).toEqual([g.find('p2', 'characters', V.c4)]);
  });
});
