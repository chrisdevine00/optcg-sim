/** OP17-096 I'm Luffy!! The Man Who Will Be King of the Pirates!! */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  endCounter,
  expectDecision,
  game,
  hand,
  none,
  passBlock,
  pick,
  PLAIN_BLUE,
  takeDamage,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { damageWith } from './triggers.ts';
import { ELBAPH, GIANT } from './helpers-sabo.ts';

describe("OP17-096 I'm Luffy!!", () => {
  /** P2 attacks P1's Leader; P1 reaches the Counter Step with the Event. */
  const counterStep = (p1Chars: string[], opp: string[] = []) => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP17-096'],
        characters: p1Chars,
        costArea: { active: 1, rested: 0 },
        life: [BLUE, BLUE, BLUE],
      },
      { leader: PLAIN_BLUE, characters: [V.c7, ...opp] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    expectDecision(g, 'counter', 'p1');
    return g;
  };

  it('[Counter]: with a cost 12+ Character, up to 1 of your Leader or Characters gains +4000 power during this battle', () => {
    const g = counterStep([GIANT, V.c3]);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP17-096'), ability: 'counter' });
    // The Leader and both Characters can be chosen.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });

  it('[Counter]: the boost ends with the battle', () => {
    const g = counterStep([GIANT]);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP17-096'), ability: 'counter' });
    pick(g, [g.leader('p1')]);
    endCounter(g);
    // 9000 against 9000: the attack still connects; Life is taken, then the battle is over.
    takeDamage(g);
    expectDecision(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter]: "up to 1" may choose nothing', () => {
    const g = counterStep([GIANT]);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP17-096'), ability: 'counter' });
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter]: without a cost 12+ Character it has no effect (the Event is still spent)', () => {
    const g = counterStep([V.c3]);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP17-096'), ability: 'counter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it("[Counter]: an opponent's cost 12+ Character satisfies the condition", () => {
    const g = counterStep([V.c3], [GIANT]);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP17-096'), ability: 'counter' });
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('[Trigger]: add up to 1 {Elbaph} card from your trash to your hand', () => {
    const g = damageWith('OP17-096', { trash: [BLUE, ELBAPH, GIANT] });
    g.act({ type: 'trigger', activate: true });
    // Rodo and Saul are {Elbaph}; the vanilla is not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'trash', ELBAPH)]);
    expect(hand(g, 'p1')).toEqual([ELBAPH]);
  });

  it('[Trigger]: "up to 1" may take nothing', () => {
    const g = damageWith('OP17-096', { trash: [ELBAPH] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
