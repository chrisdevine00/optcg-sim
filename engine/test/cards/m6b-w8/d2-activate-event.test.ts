/**
 * M6b wave 8, D2: an effect activates an Event from the hand or from the trash (OP15-014 Bartolomeo,
 * OP15-046 Sabo, OP12-041 Sanji, EB03-031 Reiju). Official readings (OP12 Q&A for OP12-041, EB03 Q&A for
 * EB03-031, OP15 Q&A for OP15-046): the Event's printed cost is not paid but its activation cost
 * (DON!! -N) is; the Event from the hand is trashed; only [Main] effects can be activated; from the hand
 * it counts as an activation ("When you activate an Event" fires), from the trash it does not.
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents } from '@optcg/engine';
import { internals, withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  don,
  expectDecision,
  game,
  hand,
  none,
  pick,
  PLAIN_BLUE,
  trash,
  V,
} from '../helpers.ts';
import { errorsOf, main } from '../m6b-w1/probe.ts';

// Events: OP01-029 (cost 1, Straw Hat Crew), OP01-089 (cost 3, Baroque Works), OP01-027 (cost 4,
// Beautiful Pirates), OP01-055 (cost 1, Land of Wano).
const SHC = 'OP01-029';
const BW3 = 'OP01-089';
const BIG = 'OP01-027';
const WANO = 'OP01-055';

const draw1 = [{ do: { draw: 1 } }] as never;
const mainOf = (effect: unknown, cost?: unknown[]): Ability =>
  ({
    id: 'm',
    kind: 'activate',
    when: 'main',
    ...(cost ? { cost } : {}),
    effect,
  }) as unknown as Ability;

/** "Activate up to 1 Straw Hat Crew Event with a base cost of 3 or less from your hand." */
const sel = (from: 'hand' | 'trash', filter?: object) => ({
  from,
  owner: 'you',
  filter: filter ?? {
    all: [{ category: ['Event'] }, { type: 'Straw Hat Crew' }, { baseCost: { lte: 3 } }],
  },
  pick: { upTo: 1 },
});
const act = (from: 'hand' | 'trash' = 'hand', filter?: object) =>
  main([{ do: { activate: { ability: 'main', of: sel(from, filter) } } }] as never);

/** p1 (active, Leader PLAIN_BLUE, 3 DON!! active) has BLUE with the activator `a`; `extra` per spec. */
const mk = (p1: object = {}, ab: Ability = act()) => {
  const g = game(
    {
      leader: PLAIN_BLUE,
      characters: [BLUE, V.c1],
      hand: [SHC, WANO, BIG, BW3, V.c4],
      costArea: { active: 3, rested: 0 },
      ...p1,
    },
    { leader: 'ST04-001', characters: [V.c2] },
  );
  g.state = withAbilities(g.state, BLUE, [ab]);
  for (const id of [SHC, WANO, BIG, BW3]) {
    try {
      g.state = withAbilities(g.state, id, [mainOf(draw1)]);
    } catch {
      // not in this game
    }
  }
  return g;
};
const runIt = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
const choose = (g: ReturnType<typeof mk>) => expectDecision(g, 'choose', 'p1');
/** The cards the open choice offers. */
const cands = (g: ReturnType<typeof mk>): string[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
const secret = (g: ReturnType<typeof mk>): boolean => !!internals(g.state).decision?.secret;
const activator = (effect: unknown): unknown => ({
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  effect,
});

describe('D2 activate an Event from the hand', () => {
  it('validates, and refuses shapes that would do something else', () => {
    expect(errorsOf(act())).toEqual([]);
    expect(errorsOf(act('trash'))).toEqual([]);
    const bad = (of: object, ability = 'main') =>
      errorsOf(activator([{ do: { activate: { ability, of } } }]));
    expect(bad(sel('hand'), 'counter')).not.toEqual([]); // only [Main] (official OP12-041 Q&A)
    expect(bad(sel('hand'), 'onPlay')).not.toEqual([]);
    expect(bad({ ...sel('hand'), from: 'deckTop' })).not.toEqual([]);
    expect(bad({ ...sel('hand'), from: ['hand', 'trash'] })).not.toEqual([]); // one zone
    expect(bad({ ...sel('hand'), owner: 'opponent' })).not.toEqual([]);
    expect(bad({ ...sel('hand'), pick: { upTo: 2 } })).not.toEqual([]);
    expect(bad({ ...sel('hand'), pick: undefined })).not.toEqual([]);
    expect(bad(sel('hand', { type: 'Straw Hat Crew' }))).not.toEqual([]); // could name a Character
    expect(bad({ ...sel('hand'), reveal: true })).not.toEqual([]);
    // As a cost it is refused: an activation is an effect.
    expect(
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        cost: [{ activate: { ability: 'main', of: sel('hand') } }],
        effect: [],
      }),
    ).not.toEqual([]);
  });

  it('activates the chosen Event for free: trashed, its [Main] resolves, no printed cost paid', () => {
    const g = mk();
    runIt(g);
    choose(g);
    expect(cands(g)).toEqual([g.find('p1', 'hand', SHC)]); // the filter: type, base cost 3 or less
    const h0 = hand(g, 'p1').length;
    pick(g, [g.find('p1', 'hand', SHC)]);
    expect(trash(g, 'p1')).toEqual([SHC]);
    expect(hand(g, 'p1').length).toBe(h0 - 1 + 1); // the Event left, its [Main] drew 1
    expect(don(g, 'p1').active).toBe(3); // the printed cost (1) was not paid
    expect(g.events.some((e) => e.type === 'EventActivated')).toBe(true);
  });

  it('an Event with a higher base cost, another type or no [Main] is not a candidate', () => {
    const g = mk({ hand: [BIG, WANO, BW3] });
    runIt(g);
    // Nothing passes the filter; the hand is secret, so the question is still asked (empty).
    choose(g);
    expect(cands(g)).toEqual([]);
    expect(secret(g)).toBe(true);
    none(g);
    expect(trash(g, 'p1')).toEqual([]);
    const c = mk({ hand: [SHC] });
    c.state = withAbilities(c.state, SHC, [
      { id: 'c', kind: 'activate', when: 'counter', effect: draw1 } as unknown as Ability,
    ]);
    runIt(c);
    choose(c);
    expect(cands(c)).toEqual([]); // a [Counter]-only Event is not activated this way
  });

  it('pays the activation cost written on the Event (DON!! -1), and cannot choose it when unpayable', () => {
    const cost = [{ donMinus: 1 }];
    const g = mk({}, act('hand', { all: [{ category: ['Event'] }, { type: 'Baroque Works' }] }));
    g.state = withAbilities(g.state, BW3, [mainOf(draw1, cost)]);
    runIt(g);
    // DON!! -1 is optional ("you may return"), so the Event is activated and then the cost is asked.
    pick(g, [g.find('p1', 'hand', BW3)]);
    expect(dec(g)?.kind).toBe('optional');
    g.act({ type: 'optional', accept: true });
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(2);
    // No DON!! on the field: a [Main] costing DON!! -1 that is not optional cannot be activated.
    const none0 = mk(
      { costArea: { active: 0, rested: 0 } },
      act('hand', { all: [{ category: ['Event'] }, { type: 'Baroque Works' }] }),
    );
    none0.state = withAbilities(none0.state, BW3, [
      mainOf(draw1, [{ restDon: 1 }]), // a mandatory cost
    ]);
    runIt(none0);
    choose(none0);
    expect(cands(none0)).toEqual([]);
  });

  it('counts as activating an Event: "When you activate an Event" fires', () => {
    const g = mk();
    g.state = withAbilities(g.state, V.c1, [
      {
        id: 'w',
        kind: 'auto',
        when: [{ event: 'eventActivated', by: 'you' }],
        effect: [
          {
            do: {
              power: { target: { from: 'self', owner: 'you' }, amount: 1000, duration: 'thisTurn' },
            },
          },
        ],
      } as unknown as Ability,
    ]);
    const base = g.power(g.find('p1', 'characters', V.c1));
    runIt(g);
    pick(g, [g.find('p1', 'hand', SHC)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(base! + 1000);
  });
});

describe('D2 activate the [Main] of an Event in the trash', () => {
  it('runs the [Main] and the card stays in the trash; no watcher sees an activation', () => {
    const g = mk({ trash: [SHC, BIG], hand: [V.c4] }, act('trash'));
    g.state = withAbilities(g.state, V.c1, [
      {
        id: 'w',
        kind: 'auto',
        when: [{ event: 'eventActivated', by: 'you' }],
        effect: [
          {
            do: {
              power: { target: { from: 'self', owner: 'you' }, amount: 1000, duration: 'thisTurn' },
            },
          },
        ],
      } as unknown as Ability,
    ]);
    const base = g.power(g.find('p1', 'characters', V.c1));
    runIt(g);
    choose(g);
    expect(cands(g)).toEqual([g.find('p1', 'trash', SHC)]); // BIG has base cost 4
    const h0 = hand(g, 'p1').length;
    pick(g, [g.find('p1', 'trash', SHC)]);
    expect(hand(g, 'p1').length).toBe(h0 + 1); // its [Main] drew 1
    expect(trash(g, 'p1').sort()).toEqual([BIG, SHC].sort()); // still there
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(base); // EB03-031 Q&A: not an activation
    expect(g.events.some((e) => e.type === 'EventActivated')).toBe(false);
    expect(don(g, 'p1').active).toBe(3);
  });

  it('can be activated again: the Event never left the trash', () => {
    const g = mk({ trash: [SHC], hand: [V.c4] }, act('trash'));
    runIt(g);
    pick(g, [g.find('p1', 'trash', SHC)]);
    expect(internals(g.state).cards[g.find('p1', 'trash', SHC)]!.zone).toBe('trash');
  });
});

describe('D2 hidden information', () => {
  const seen = (g: ReturnType<typeof mk>, who: 'p1' | 'p2') =>
    JSON.stringify([project(g.state, who), projectEvents(g.events, who)]);
  const at = (handCards: string[], decline = false) => {
    const g = mk({ hand: handCards });
    runIt(g);
    if (decline) none(g);
    return g;
  };

  it('the opponent sees the same prompt whether or not the hand holds an Event to activate', () => {
    const a = at([SHC, V.c4]); // an Event that passes the filter
    const b = at([V.c5, V.c4]); // nothing that does
    expect(seen(a, 'p2')).toBe(seen(b, 'p2'));
    // The chooser's own view differs (the control: the test can tell the positions apart).
    expect(seen(a, 'p1')).not.toBe(seen(b, 'p1'));
    expect(secret(a)).toBe(true);
    expect(secret(b)).toBe(true);
  });

  it('declining leaves the opponent’s view of the two hands identical', () => {
    expect(seen(at([SHC, V.c4], true), 'p2')).toBe(seen(at([V.c5, V.c4], true), 'p2'));
  });
});
