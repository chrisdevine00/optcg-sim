/** OP16-119 Marshall.D.Teach: [On Play] look at 3, add up to 1 to the top of Life; [Trigger] negate, then K.O. cost 5 or less. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, none, pick, play, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { BMP, ENEL, ids, settleOrder, TRIG, triggerHit } from './helpers-robin.ts';

const TEACH = 'OP16-119';
const BORSALINO = 'EB04-058';

describe('OP16-119 Marshall.D.Teach', () => {
  const onPlay = () =>
    game(
      {
        leader: ENEL,
        hand: [TEACH],
        deck: [BLUE, BMP, TRIG, PURPLE],
        costArea: { active: 8, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[On Play] add one of the top 3 to the top of Life, the other 2 go to the bottom', () => {
    const g = onPlay();
    play(g, TEACH);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.find('p1', 'deck', BMP)]);
    settleOrder(g);
    expect(ids(g, 'p1', 'life')[0]).toBe(BMP);
    expect(g.life('p1')).toBe(4);
    const deck = ids(g, 'p1', 'deck');
    expect(deck[0]).toBe(PURPLE);
    expect([...deck.slice(1)].sort()).toEqual([BLUE, TRIG].sort());
  });

  it('[On Play] "up to 1": may add nothing; all 3 go to the bottom', () => {
    const g = onPlay();
    play(g, TEACH);
    none(g);
    settleOrder(g);
    expect(g.life('p1')).toBe(3);
    expect(ids(g, 'p1', 'deck')[0]).toBe(PURPLE);
    expect(g.zone('p1', 'deck')).toHaveLength(4);
  });

  it('[Trigger] negates a Character, then K.O.s a Character with a cost of 5 or less', () => {
    const g = triggerHit(TEACH, {}, [BORSALINO, V.c4]);
    g.act({ type: 'trigger', activate: true });
    const negated = g.find('p2', 'characters', V.c7);
    pick(g, [negated]);
    // K.O. candidates: cost 5 or less only (Borsalino 5, the cost 4 vanilla), not the 7000 attacker.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c4]);
    expect(ids(g, 'p2', 'characters')).toContain(BORSALINO);
    expect(ids(g, 'p1', 'trash')).toEqual([TEACH]);
  });

  it('[Trigger] the K.O. does not depend on the negate target: Borsalino negated then K.O.d', () => {
    const g = triggerHit(TEACH, {}, [BORSALINO]);
    g.act({ type: 'trigger', activate: true });
    const b = g.find('p2', 'characters', BORSALINO);
    pick(g, [b]);
    expect(g.card(b).keywords).not.toContain('Blocker');
    pick(g, [b]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c7]);
  });

  it('[Trigger] with nothing of cost 5 or less the K.O. finds no target', () => {
    const g = triggerHit(TEACH);
    g.act({ type: 'trigger', activate: true });
    none(g); // negate nothing
    expect(ids(g, 'p2', 'characters')).toEqual([V.c7]);
    expectDecision(g, 'main', 'p2');
  });
});
