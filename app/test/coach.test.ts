/**
 * The coach's lethal detector (L, learning-ui §3.1) driven through the game controller, with the
 * worker replaced by the same search run in process.
 * - the tiers reveal one at a time, and a position change clears them;
 * - an always-on level checks at the start of the Main Phase and after a move, and sets a badge;
 * - an unfinished search is "Unknown", never "no lethal";
 * - hidden information: what reaches the detector, when, and what it says do not depend on the
 *   opponent's hidden cards, and it runs in `public` mode only.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import type { Card } from '@optcg/cards';
import { lethal } from '@optcg/ai';
import type { SearchView } from '@optcg/engine';
import { GameController } from '../src/play/game/controller.ts';
import type { LethalPort } from '../src/play/game/ai-client.ts';
import { lethalBadge } from '../src/play/coach/badge.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { cardMap } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class InProcessLethal implements LethalPort {
  readonly requests: { view: SearchView; priority: number; mode: string }[] = [];
  readonly cancelled: number[] = [];
  private n = 1;
  constructor(
    private readonly opts: { nodes?: number } = {},
    readonly init: Card[] = [],
  ) {}
  lethal(view: SearchView, o: { priority: 2 | 3 | 4; capMs?: number; nodes?: number }) {
    this.requests.push({ view, priority: o.priority, mode: 'public' });
    const result = lethal({ mode: 'public', view }, cardMap(), {
      nodes: this.opts.nodes ?? 150_000,
    });
    return { id: this.n++, result: sleep(5).then(() => ({ result, ms: 5 })) };
  }
  reveal() {}
  cancel(id: number) {
    this.cancelled.push(id);
  }
  terminate() {}
}

function game(
  patch: (spec: (typeof SCENARIOS)[string]) => (typeof SCENARIOS)[string] = (s) => s,
  port: InProcessLethal = new InProcessLethal(),
) {
  const { mode: _m, ...spec } = patch(SCENARIOS.lethalDemo!);
  const ctl = new GameController(
    cardMap(),
    { scenario: spec },
    {
      mode: 'ai',
      human: 'p1',
      names: { p1: 'You', p2: 'Rocks' },
      tier: 'pirate',
      autoSkip: true,
      alwaysSkip: false,
      speed: 4,
      aiCardIds: ['OP17-039'],
      aiDeck: [],
      aiPort: () => ({
        planTurn: () => ({ id: 0, result: Promise.resolve() }),
        decide: () => ({ id: 0, result: new Promise(() => undefined) }),
        reveal() {},
        cancel() {},
        reset() {},
        terminate() {},
      }),
      coachPort: () => port,
    },
  );
  ctl.start();
  return { ctl, port };
}

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* node */
  }
});

const ready = async (ctl: GameController) => {
  for (let i = 0; i < 100 && ctl.coach.lethal.status !== 'ready'; i++) await sleep(10);
};

describe('the tiered lethal detector', () => {
  it('reveals tier 1, then 2, then 3, and says how sure it is', async () => {
    const { ctl } = game();
    await sleep(50);
    expect(ctl.coach.lethal.key).not.toBeNull();
    // Nothing runs until asked (Ask me is the default).
    expect(ctl.coach.lethal.status).toBe('idle');
    ctl.coach.press();
    expect(ctl.coach.lethal.status).toBe('checking');
    expect(ctl.coach.tier1()).toBeNull();
    await ready(ctl);
    const t1 = ctl.coach.tier1()!;
    expect(ctl.coach.lethal.tier).toBe(1);
    expect(t1).toMatchObject({
      status: 'proven',
      text: 'Lethal is on the board.',
      chip: 'Works against any hand',
    });
    expect(ctl.polite.text).toBe('Lethal: proven, works against any hand.');
    ctl.coach.press();
    expect(ctl.coach.lethal.tier).toBe(2);
    expect(ctl.coach.tier2()!.text).toBe(
      'You need 2 hits. You have 2 attackers that can hit their Leader.',
    );
    ctl.coach.press();
    expect(ctl.coach.lethal.tier).toBe(3);
    const ex = ctl.coach.explanation()!;
    expect(ex.certainty).toBe('any-hand');
    expect(ex.line!.length).toBeGreaterThan(1);
    ctl.dispose();
  });

  it('clears the answer when the position changes, and never runs outside your Main Phase', async () => {
    const { ctl } = game();
    await sleep(50);
    ctl.coach.press();
    await ready(ctl);
    const give = ctl.actions().find((a) => a.type === 'giveDon');
    expect(give).toBeDefined();
    ctl.act(give!);
    await sleep(30);
    expect(ctl.coach.lethal.result).toBeNull();
    expect(ctl.coach.lethal.tier).toBe(0);
    ctl.dispose();
  });

  it('an always-on level checks by itself, badges the Lethal button and speaks politely', async () => {
    const { ctl, port } = game();
    await sleep(50);
    expect(port.requests).toHaveLength(0);
    ctl.coach.setAlwaysOn(2);
    await ready(ctl);
    expect(port.requests.at(-1)!.priority).toBe(4);
    expect(lethalBadge(ctl.coach)).toEqual({ glyph: '◆', text: '2 hits' });
    expect(ctl.polite.text).toBe('You need 2 hits. You have 2 attackers.');
    // Tier 3 still needs a press.
    expect(ctl.coach.lethal.tier).toBe(2);
    // After a move of yours, it checks again at the lowest priority.
    const n = port.requests.length;
    ctl.act(ctl.actions().find((a) => a.type === 'giveDon')!);
    await sleep(60);
    expect(port.requests.length).toBe(n + 1);
    expect(port.requests.at(-1)!.priority).toBe(4);
    ctl.dispose();
  });

  it('an unfinished search is Unknown, never "no lethal"', async () => {
    const { ctl } = game(undefined, new InProcessLethal({ nodes: 3 }));
    await sleep(50);
    ctl.coach.press();
    await ready(ctl);
    const t1 = ctl.coach.tier1()!;
    expect(t1.status).toBe('unknown');
    expect(t1.text).toBe("Couldn't finish checking.");
    expect(t1.text).not.toMatch(/No lethal/);
    expect(lethalBadge(ctl.coach)).toBeNull();
    ctl.dispose();
  });
});

describe('the guided count', () => {
  it('checks the hits, the attackers and the split, and explains what is wrong', async () => {
    const { ctl } = game();
    await sleep(50);
    ctl.coach.press();
    await ready(ctl);
    ctl.coach.startGuided();
    const g = ctl.coach.guided!;
    expect(g.data.hits.hitsNeeded).toBe(2);
    const refs = g.data.attackers.map((a) => a.ref);
    // Wrong hits, right attackers, no split.
    ctl.coach.guide({ hits: '3', picked: refs });
    let c = ctl.coach.checkCount()!;
    expect(c.hits.correct).toBe(false);
    expect(c.hits.reason).toBe('They have 1 Life, so you need 1 + 1 = 2 hits.');
    expect(c.attackers.correct).toBe(true);
    // The line's own split passes.
    ctl.coach.guide({
      hits: '2',
      split: g.data.split.map((s) => ({ ref: s.ref, don: s.don })),
    });
    c = ctl.coach.checkCount()!;
    expect(c.hits.correct).toBe(true);
    expect(c.split.correct).toBe(true);
    // The DON!! on the wrong attacker leaves the first attack too small to beat what they can have.
    ctl.coach.guide({ split: g.data.split.map((s, i) => ({ ref: s.ref, don: i === 0 ? 0 : 4 })) });
    c = ctl.coach.checkCount()!;
    expect(c.split.correct).toBe(false);
    ctl.dispose();
  });
});

describe('hidden information', () => {
  const swap = (spec: (typeof SCENARIOS)[string]) => ({
    ...spec,
    p2: {
      ...spec.p2,
      // Their hidden hand, deck and Life are different cards: nothing public changes.
      hand: ['EB04-007', 'EB04-007'],
      deck: Array.from({ length: 12 }, () => 'OP17-056'),
      life: ['OP17-055'],
    },
  });

  it('what reaches the detector is the player’s own search view, the same for any hidden cards', async () => {
    const a = game();
    const b = game(swap);
    await sleep(50);
    for (const g of [a, b]) g.ctl.coach.setAlwaysOn(1);
    await ready(a.ctl);
    await ready(b.ctl);
    expect(a.port.requests).toHaveLength(1);
    expect(b.port.requests).toHaveLength(1);
    const view = a.port.requests[0]!.view;
    expect(view.player).toBe('p1');
    expect(a.port.requests[0]!.mode).toBe('public');
    // Identical requests, identical timing (one at the start of the Main Phase), identical text.
    expect(JSON.stringify(b.port.requests[0]!.view)).toBe(JSON.stringify(view));
    expect(b.ctl.coach.tier1()).toEqual(a.ctl.coach.tier1());
    expect(b.ctl.polite.text).toBe(a.ctl.polite.text);
    // The opponent's hand is face-down placeholders in what the worker gets.
    expect(view.zones.p2.hand.every((c) => c.card === null)).toBe(true);
    a.ctl.dispose();
    b.ctl.dispose();
  });

  it('is not offered in hotseat, where a second person may be looking', async () => {
    const { mode: _m, ...spec } = SCENARIOS.lethalDemo!;
    const port = new InProcessLethal();
    const ctl = new GameController(
      cardMap(),
      { scenario: spec },
      {
        mode: 'hotseat',
        human: 'p1',
        names: { p1: 'A', p2: 'B' },
        tier: 'rookie',
        autoSkip: true,
        alwaysSkip: false,
        speed: 4,
        coachPort: () => port,
      },
    );
    ctl.start();
    await sleep(50);
    ctl.liftCurtain();
    ctl.coach.setAlwaysOn(2);
    ctl.coach.press();
    await sleep(50);
    expect(port.requests).toHaveLength(0);
    ctl.dispose();
  });
});

describe('the polite tier 1 line carries the Trigger caveat that fits the certainty (L-13, L-14)', () => {
  /** The detector's answer with a Trigger chance, and a certainty chosen by the test. */
  class WithTrigger extends InProcessLethal {
    constructor(private readonly certainty: 'any-hand' | 'needed-hidden-info') {
      super();
    }
    override lethal(view: SearchView, o: { priority: 2 | 3 | 4; capMs?: number; nodes?: number }) {
      const r = super.lethal(view, o);
      return {
        id: r.id,
        result: r.result.then((x) => ({
          ms: x.ms,
          result: {
            ...x.result,
            certainty: this.certainty,
            trigger: { exposed: 1, triggersInPrior: 5, probabilityNone: 0.4 },
          },
        })),
      };
    }
  }

  it.each([
    ['any-hand', 'Works against any hand, unless a Life card'],
    ['needed-hidden-info', "Depends on their hand, and a Life card's Trigger could stop it"],
  ] as const)('%s', async (certainty, words) => {
    const { ctl } = game((s) => s, new WithTrigger(certainty));
    await sleep(50);
    ctl.coach.press();
    await ready(ctl);
    expect(ctl.polite.text).toContain(words);
    expect(ctl.polite.text).toContain('Trigger'); // dropping the caveat fails here
    if (certainty === 'needed-hidden-info')
      expect(ctl.polite.text.toLowerCase()).not.toContain('any hand');
    ctl.dispose();
  });
});
