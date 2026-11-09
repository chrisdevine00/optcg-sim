/**
 * Carried review items built in L:
 * - M4a-16: the veiled Use hint comes from the decision's own source, the input `veiledUse` uses;
 * - M4a-18: an Event whose optional cost cannot be paid is marked before it is wasted;
 * - M5a-21: Setup's turn-time copy matches docs/benchmarks.md.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCRIPTS, type Ability, type CardScript } from '@optcg/cards';
import type { Action } from '@optcg/engine';
import { GameController } from '../src/play/game/controller.ts';
import { readsHiddenZone } from '../src/play/game/veiled.tsx';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { TURN_TIME_PIRATE, TURN_TIME_ROOKIE } from '../src/play/setup/Setup.tsx';
import { cardMap } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function hotseat(name: string) {
  const { mode: _m, ...spec } = SCENARIOS[name]!;
  return new GameController(
    cardMap(),
    { scenario: spec },
    {
      mode: 'hotseat',
      human: 'p1',
      names: { p1: 'Player 1', p2: 'Player 2' },
      tier: 'rookie',
      autoSkip: true,
      alwaysSkip: false,
      speed: 4,
    },
  );
}

describe('M4a-16: the veiled Use hint follows the decision’s source', () => {
  it('is decided by the same input as Use, and says Use answers without the hand', async () => {
    const ctl = hotseat('veiled');
    ctl.start();
    await sleep(100);
    ctl.liftCurtain();
    const v = ctl.view();
    const attack = ctl
      .actions()
      .find((a) => a.type === 'attack' && a.target === v.zones.p1.leader[0]!.handle);
    expect(attack).toBeDefined();
    ctl.act(attack as Action);
    await sleep(200);
    // Whatever the last public activation was, the hint is about this decision's own effect.
    const d = ctl.session.view('p1').decision!;
    expect(d.kind === 'optional' || d.kind === 'block').toBe(true);
    if (d.kind === 'optional') {
      expect(ctl.veiledProps().usesHand).toBe(readsHiddenZone(d.source));
    }
  });
});

describe('M4a-18: an Event that cannot pay its optional cost', () => {
  it('is reported unpayable when it is the only card in hand, payable with another', () => {
    const base = SCENARIOS.defend!;
    const { mode: _m, ...spec } = base;
    const mk = (hand: string[]) =>
      new GameController(
        cardMap(),
        {
          scenario: {
            ...spec,
            p1: { ...spec.p1, leader: 'ST01-001', hand, characters: [] },
          },
        },
        {
          mode: 'hotseat',
          human: 'p1',
          names: { p1: 'Player 1', p2: 'Player 2' },
          tier: 'rookie',
          autoSkip: true,
          alwaysSkip: false,
          speed: 4,
        },
      );
    for (const [hand, expected] of [
      [['OP17-076'], false],
      [['OP17-076', 'OP01-010'], true],
    ] as const) {
      const ctl = mk([...hand]);
      ctl.start();
      ctl.liftCurtain();
      const p2 = ctl.view();
      const atk = ctl
        .actions()
        .find((a) => a.type === 'attack' && a.target === p2.zones.p2.leader[0]?.handle);
      // The scenario starts on p2's Main: attack p1's Leader with p2's Leader.
      const attack = ctl
        .actions()
        .find(
          (a) =>
            a.type === 'attack' && a.target === ctl.session.view('p2').zones.p1.leader[0]!.handle,
        );
      expect(atk ?? attack).toBeDefined();
      ctl.act((attack ?? atk) as Action);
      // p1 owes the block decision, then the Counter Step.
      ctl.liftCurtain();
      const block = ctl.session.view('p1').actions.find((a) => a.type === 'block' && !a.blocker);
      if (block) ctl.act(block);
      const act = ctl.session.view('p1').actions.find((a) => a.type === 'activate');
      expect(act).toBeDefined();
      expect(ctl.session.optionalCostPayable('p1', act!)).toBe(expected);
    }
  });
});

describe('M5a-21: Setup turn-time copy matches docs/benchmarks.md', () => {
  const bench = readFileSync(new URL('../../docs/benchmarks.md', import.meta.url), 'utf8');
  it('lists both lines under "Setup copy"', () => {
    expect(bench).toContain(TURN_TIME_PIRATE);
    expect(bench).toContain(TURN_TIME_ROOKIE);
  });
});

describe('M4a-17: the veiled Use check is a typed walk, not a pattern over JSON', () => {
  // A real ability that reads no hidden zone carries planted shapes. The old regex ignored the
  // planted map (it read only SCRIPTS) and missed array and lifeTop spellings.
  const real = Object.values(SCRIPTS).flatMap((s) =>
    s.abilities
      .filter((a) => a.kind === 'activate' || a.kind === 'auto')
      .map((a) => ({ card: s.cardId, ability: a.id, script: s, a })),
  );
  const carrier = real.find((r) => !readsHiddenZone({ card: r.card, ability: r.ability }))!;

  const plant = (cost: unknown) => {
    const a = { ...carrier.a, cost: [cost] } as unknown as Ability;
    const script = { ...carrier.script, abilities: [a] } as CardScript;
    return readsHiddenZone({ card: carrier.card, ability: a.id }, { [carrier.card]: script });
  };

  it('catches an array from that includes the hand', () => {
    expect(
      plant({ trash: { from: ['hand', 'characters'], owner: 'you', pick: { exactly: 1 } } }),
    ).toBe(true);
  });
  it('catches lifeTop and lifeTopOrBottom', () => {
    expect(plant({ trash: { from: 'lifeTop', owner: 'you', pick: { exactly: 1 } } })).toBe(true);
    expect(plant({ trash: { from: ['trash', 'lifeTopOrBottom'], owner: 'you' } })).toBe(true);
  });
  it('does not flag a public zone', () => {
    expect(plant({ rest: { from: 'characters', owner: 'you', pick: { exactly: 1 } } })).toBe(false);
  });
});
