/** EB03-059 S-Snake. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  hand,
  KAIDO,
  none,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { canPick, cardsIn, LUFFY_C, mk, TRIG4, VEGAPUNK_LEADER } from './helpers-eb03g2.ts';

const ID = 'EB03-059';
/** An Event with a [Trigger]. */
const TRIGGER_EVENT = 'EB01-010';
const life2 = [V.c1, V.c2];

describe('EB03-059 S-Snake', () => {
  it('[On Play]: with an {Egghead} Leader and 2+ Life, adds a Character with a [Trigger] from the hand to the top of Life face-up', () => {
    const g = mk({ leader: VEGAPUNK_LEADER, hand: [ID, TRIG4, V.c3, TRIGGER_EVENT], life: life2 });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', TRIG4))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false); // no [Trigger]
    expect(canPick(g, g.find('p1', 'hand', TRIGGER_EVENT))).toBe(false); // not a Character
    pick(g, [g.find('p1', 'hand', TRIG4)]);
    expect(g.life('p1')).toBe(3);
    const top = g.zone('p1', 'life')[0]!;
    expect(top.card).toBe(TRIG4);
    expect(top.faceUp).toBe(true);
    expect(hand(g, 'p1')).toEqual([V.c3, TRIGGER_EVENT]);
  });

  it('boundary: exactly 2 Life cards fires, 1 does not (and nothing is asked)', () => {
    const g = mk({ leader: VEGAPUNK_LEADER, hand: [ID, TRIG4], life: [V.c1] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.life('p1')).toBe(1);
  });

  it('a Leader without the {Egghead} type does nothing', () => {
    const g = mk({ hand: [ID, TRIG4], life: life2 });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([TRIG4]);
  });

  it('"up to 1": may add nothing', () => {
    const g = mk({ leader: VEGAPUNK_LEADER, hand: [ID, TRIG4], life: life2 });
    play(g, ID);
    none(g);
    expect(g.life('p1')).toBe(2);
  });

  describe('[Trigger]', () => {
    const fire = (extra: string[] = []) => {
      const g = game(
        { leader: KAIDO, life: [ID, PURPLE] },
        { leader: PLAIN_BLUE, characters: [V.c7, V.c6, LUFFY_C, V.c3, ...extra] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
      passBlock(g);
      endCounter(g);
      expectDecision(g, 'trigger', 'p1');
      g.act({ type: 'trigger', activate: true });
      return g;
    };

    it('up to 1 Character with a cost of 6 or less other than [Monkey.D.Luffy] cannot attack this turn', () => {
      const g = fire();
      expectDecision(g, 'choose', 'p1');
      expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(true); // boundary: cost 6
      expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false); // cost 7
      expect(canPick(g, g.find('p2', 'characters', LUFFY_C))).toBe(false); // [Monkey.D.Luffy]
      expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(g.card(g.find('p2', 'characters', V.c3)).cannotAttack).toBe(true);
      expect(g.card(g.find('p2', 'characters', V.c6)).cannotAttack).toBeFalsy();
    });

    it('"up to 1": may choose nothing', () => {
      const g = fire();
      none(g);
      expect(g.card(g.find('p2', 'characters', V.c3)).cannotAttack).toBeFalsy();
    });

    it('lasts this turn only: the Character can attack on its next turn', () => {
      const g = fire();
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(cardsIn(g, 'p2', 'characters')).toContain(V.c3);
      while (g.legal().some((a) => a.type === 'trigger'))
        g.act({ type: 'trigger', activate: false });
      g.act({ type: 'endTurn' });
      g.act({ type: 'endTurn' });
      expect(g.card(g.find('p2', 'characters', V.c3)).cannotAttack).toBeFalsy();
    });
  });
});
