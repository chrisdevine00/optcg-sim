/** OP13-108 Jewelry Bonney. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, pick, play, PLAIN_PURPLE, PURPLE, V } from './helpers.ts';
import {
  canAttack,
  EGG_LEADER,
  mine,
  names,
  OTHER_LEADER,
  rep,
  skipOptional,
  trig,
} from './helpers-op13g4.ts';

const ID = 'OP13-108';

describe('OP13-108 Jewelry Bonney', () => {
  const run = (leader: string) => {
    const g = mine(
      { leader, hand: [ID] },
      { leader: OTHER_LEADER, life: [V.c1, V.c2, V.c3], characters: [] },
      9,
    );
    play(g, ID);
    return g;
  };

  it('[On Play] with an {Egghead} Leader: gains [Rush]; the opponent adds the top Life card to their hand', () => {
    const g = run(EGG_LEADER);
    const id = g.find('p1', 'characters', ID);
    expect(g.card(id).keywords).toContain('Rush');
    expect(canAttack(g, id, g.leader('p2'))).toBe(true);
    expect(g.life('p2')).toBe(2);
    expect(names(g, 'p2', 'hand')).toContain(V.c1);
  });

  it('without {Egghead} there is no [Rush] and the opponent keeps their Life ("Then" after a failed "If", M4b-5)', () => {
    const g = run(PLAIN_PURPLE);
    const id = g.find('p1', 'characters', ID);
    expect(g.card(id).keywords).not.toContain('Rush');
    expect(g.life('p2')).toBe(3);
  });

  it('with an empty Life area nothing is added', () => {
    const g = mine({ leader: EGG_LEADER, hand: [ID] }, { life: [] }, 9);
    play(g, ID);
    expect(g.life('p2')).toBe(0);
    expect(dec(g)?.kind).toBe('main');
  });

  it('[Rush] is for this turn only', () => {
    const g = run(EGG_LEADER);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
  });

  describe('[Trigger]', () => {
    const fire = (life: string[], p2chars: string[]) => {
      const g = trig(ID, { leader: PLAIN_PURPLE, life: [ID, ...life] }, p2chars);
      skipOptional(g);
      g.act({ type: 'trigger', activate: true });
      return g;
    };

    it('with 1 or less Life left: rests a Character with cost 7 or less', () => {
      const g = fire([], [V.c7]);
      pick(g, [g.find('p2', 'characters', V.c7, 1)]);
      expect(g.zone('p2', 'characters').every((c) => c.rested)).toBe(true);
    });

    it('with 1 Life left it also works; with 2 Life left nothing happens', () => {
      const a = fire([PURPLE], [V.c6]);
      pick(a, [a.find('p2', 'characters', V.c6)]);
      expect(a.zone('p2', 'characters').find((c) => c.card === V.c6)!.rested).toBe(true);
      const b = fire(rep(2, PURPLE), [V.c6]);
      expect(dec(b)?.kind).not.toBe('choose');
      expect(b.zone('p2', 'characters').find((c) => c.card === V.c6)!.rested).toBe(false);
    });

    it('the Trigger rest does not reach a cost 8 Character', () => {
      const g = fire([], ['OP12-082']);
      if (dec(g)?.kind === 'choose') g.act({ type: 'done' });
      expect(g.zone('p2', 'characters').find((c) => c.card === 'OP12-082')!.rested).toBe(false);
      void BLUE;
    });
  });
});
