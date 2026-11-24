/** EB05-060 Take Care of Lilith!!!: [Main] You may trash 1 of your {Egghead} type Characters with a cost of 5 or more: Add up to 1 card from the top of your deck to the top of your Life cards. [Counter] You may turn 1 card from the top of your Life cards face-up: Up to 1 of your Leader or Characters gains +4000 power during this battle. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  game,
  passBlock,
  pick,
  play,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { ids } from './helpers-robin.ts';

const LILITH = 'EB05-060';
/** OP13-107 Shaka: {Egghead}, cost 5. ST21-006 Stussy: {Egghead}, cost 3. */
const EGG5 = 'OP13-107';
const EGG3 = 'ST21-006';

describe('EB05-060 Take Care of Lilith!!!', () => {
  const main = (chars: string[]) => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: [LILITH],
        characters: chars,
        deck: [V.c1, V.c2],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_PURPLE },
    );
    play(g, LILITH);
    return g;
  };

  it('[Main] trash an {Egghead} Character with cost 5 or more: adds the top deck card to the top of Life', () => {
    const g = main([EGG5, EGG3]);
    accept(g);
    // Only the cost 5 Egghead Character can be trashed (chosen automatically).
    expect(ids(g, 'p1', 'trash')).toContain(EGG5);
    expect(ids(g, 'p1', 'characters')).toEqual([EGG3]);
    expect(g.eventsOfType('KO')).toHaveLength(0);
    accept(g);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c1);
  });

  it('[Main] the cost may be declined: nothing is trashed, no Life is added', () => {
    const g = main([EGG5]);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([EGG5]);
    expect(g.life('p1')).toBe(3);
  });

  it('[Main] cannot be paid with only a cost 3 {Egghead} Character or a non-Egghead cost 5', () => {
    const g = main([EGG3, V.c5]);
    expectDecision(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  });

  describe('[Counter]', () => {
    const counter = (life: (string | { card: string; faceUp: boolean })[]) => {
      const g = game(
        { leader: PLAIN_PURPLE, hand: [LILITH], life, costArea: { active: 1, rested: 0 } },
        { leader: PLAIN_PURPLE, characters: [V.c5] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
      passBlock(g);
      g.act({ type: 'activate', card: g.find('p1', 'hand', LILITH), ability: 'counter' });
      return g;
    };

    it('turn the top Life card face-up: +4000 power to your Leader during this battle', () => {
      const g = counter([BLUE, BLUE, BLUE]);
      accept(g);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(9000);
      endCounter(g);
      // 9000 beats the 7000 attacker: no damage; the bonus ends with the battle.
      expect(g.life('p1')).toBe(3);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('the cost may be declined: the Life card stays face-down and there is no bonus', () => {
      const g = counter([BLUE, BLUE]);
      decline(g);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('cannot be paid when the top Life card is already face-up', () => {
      const g = counter([{ card: BLUE, faceUp: true }, BLUE]);
      expectDecision(g, 'optional', 'p1');
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    });
  });
});
