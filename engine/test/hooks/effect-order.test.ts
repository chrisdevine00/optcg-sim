/**
 * Order of auto effects (CR 8-6, RL-01..RL-03, M2-05), with abilities injected by the test helper.
 * Each effect emits a labelled `EffectResolved` event, so the label sequence is the resolution order.
 */
import { describe, expect, it } from 'vitest';
import { reduce } from '../../src/index.ts';
import type { Ability } from '../../src/testing.ts';
import { scenario, type TestGame } from '../fixtures/index.ts';
import {
  DOUBLE,
  give,
  KAIDO,
  LUFFY,
  noDefence,
  PUR_1,
  PUR_1B,
  RED_1,
  RED_5,
  takeDamage,
} from '../support/game.ts';

const labels = (g: TestGame): string[] =>
  g.events.filter((e) => e.type === 'EffectResolved').map((e) => e.label as string);
const emit = (label: string) => ({ op: 'emit' as const, label });

describe('CR 8-6: pending auto effects', () => {
  it('CR 8.6.3 / RL-03: an effect triggered during an activation waits until it finishes', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_5] },
      p2: { leader: KAIDO, characters: [PUR_1] },
    });
    const target = g.find('p2', 'characters', PUR_1);
    give(g, RED_5, [
      {
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ op: 'ko', target }, emit('rest-of-cause')],
      },
    ]);
    give(g, PUR_1, [{ id: 'k', kind: 'auto', when: ['onKO'], effect: [emit('on-ko')] }]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', RED_5), ability: 'a' });
    expect(labels(g)).toEqual(['rest-of-cause', 'on-ko']);
  });

  it("CR 8-6-1: the turn player's effects resolve first; a new turn-player effect waits behind the opponent's pending ones", () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_1] },
      p2: { leader: KAIDO, life: [PUR_1, PUR_1] },
    });
    const mine = g.find('p1', 'characters', RED_1);
    give(g, LUFFY, [
      {
        id: 'A',
        kind: 'auto',
        when: ['endOfBattle'],
        effect: [emit('A'), { op: 'ko', target: mine }],
      },
    ]);
    give(g, RED_1, [{ id: 'C', kind: 'auto', when: ['onKO'], effect: [emit('C')] }]);
    give(g, KAIDO, [{ id: 'X', kind: 'auto', when: ['endOfBattle'], effect: [emit('X')] }]);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    noDefence(g);
    expect(labels(g)).toEqual(['A', 'X', 'C']);
  });

  it('CR 8-6-1-1: with A and B pending, C triggered by A resolves after B', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_1, RED_5] },
      p2: { leader: KAIDO, life: [PUR_1, PUR_1] },
    });
    const victim = g.find('p1', 'characters', RED_1);
    give(g, LUFFY, [
      {
        id: 'A',
        kind: 'auto',
        when: ['endOfBattle'],
        effect: [emit('A'), { op: 'ko', target: victim }],
      },
    ]);
    give(g, RED_5, [{ id: 'B', kind: 'auto', when: ['endOfBattle'], effect: [emit('B')] }]);
    give(g, RED_1, [{ id: 'C', kind: 'auto', when: ['onKO'], effect: [emit('C')] }]);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    noDefence(g);
    expect(labels(g)).toEqual(['A', 'B', 'C']);
  });

  it('CR 8-6-2 / 8-6-2-1 / RL-02: [Trigger] pauses damage; other effects wait until damage processing ends', () => {
    const g = scenario({
      p1: { leader: 'OP13-001', characters: [DOUBLE] },
      p2: { leader: KAIDO, characters: [PUR_1], life: [PUR_1B, PUR_1, PUR_1] },
    });
    const z = g.find('p2', 'characters', PUR_1);
    const trigger: Ability = {
      id: 't',
      kind: 'trigger',
      effect: [emit('trigger'), { op: 'ko', target: z }],
    };
    give(g, PUR_1B, [trigger]);
    give(g, PUR_1, [{ id: 'k', kind: 'auto', when: ['onKO'], effect: [emit('on-ko')] }]);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', DOUBLE), target: g.leader('p2') });
    noDefence(g);
    g.act({ type: 'trigger', activate: true });
    takeDamage(g);
    const ev = g.events;
    const secondPoint = ev.findLastIndex((e) => e.type === 'CardMoved' && e.from === 'life');
    const onKo = ev.findIndex((e) => e.type === 'EffectResolved' && e.label === 'on-ko');
    expect(labels(g)).toEqual(['trigger', 'on-ko']);
    expect(secondPoint).toBeLessThan(onKo);
  });

  it('the pending queue is part of the state: replaying the same action reproduces it', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_5] },
      p2: { leader: KAIDO, characters: [PUR_1] },
    });
    give(g, RED_5, [
      {
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ op: 'ko', target: g.find('p2', 'characters', PUR_1) }],
      },
    ]);
    give(g, PUR_1, [
      { id: 'k', kind: 'auto', when: ['onKO'], optional: true, effect: [emit('on-ko')] },
    ]);
    const a = {
      type: 'activate' as const,
      card: g.find('p1', 'characters', RED_5),
      ability: 'a',
      player: 'p1' as const,
    };
    const x = reduce(g.state, a);
    const y = reduce(JSON.parse(JSON.stringify(g.state)), a);
    expect(JSON.stringify(x.state)).toBe(JSON.stringify(y.state));
  });
});
