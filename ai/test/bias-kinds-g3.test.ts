/**
 * The bias kinds group 3 added (`activate`, `giveDonLeader`, `activateBefore`, `avoidTarget`,
 * `targetCanAttack`, `attackWith` with `minDon`, and `acceptOptional` with `minLife`): each is
 * measured as a score difference. The same position is ranked twice with the same seed, with the
 * biases on and off; the rollouts are identical, so the difference in a move's mean is its bias.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  legalActions,
  projectForSearch,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import { AiSession } from '../src/index.ts';
import { cardMap, metaDecks } from './support.ts';
import { lifeOf, listOf, start, type Spec } from './support/scenario.ts';

vi.setConfig({ testTimeout: 60_000 });

type Ranked = { actions: Action[]; mean: number }[];

function rank(state: GameState, seat: PlayerId, biases: boolean): Ranked {
  const leader = queries.zone(state, seat, 'leader')[0]!.card;
  let captured: Ranked = [];
  const ai = new AiSession({
    tier: 'pirate',
    ownDeck: metaDecks().find((d) => d.leader === leader)!.main,
    cards: cardMap(),
    leader,
    opponentLeader: queries.zone(state, seat === 'p1' ? 'p2' : 'p1', 'leader')[0]!.card,
    budgets: 'iterations',
    biases,
    // A turn plan ranks several moves in a row; the first ranking is the position's.
    debug: (_kind, ranked) => {
      if (captured.length === 0) captured = ranked;
    },
  });
  ai.decide(projectForSearch(state, seat), 1);
  return captured;
}

const key = (actions: Action[]) =>
  JSON.stringify(actions.map(({ type, ...rest }) => ({ type, ...rest })));

/** Every move's bias: its mean with the biases on minus its mean with them off. */
function biasOf(state: GameState, seat: PlayerId = 'p1') {
  const on = rank(state, seat, true);
  const off = new Map(rank(state, seat, false).map((r) => [key(r.actions), r.mean]));
  expect(on.length).toBeGreaterThan(1);
  return on.map((r) => ({
    actions: r.actions,
    bias: r.mean - (off.get(key(r.actions)) ?? Number.NaN),
  }));
}

const act = (s: GameState, a: Action) => reduce(s, a).state;

/** Answer plainly (no block, no Counter, accept "you may", first pick) until `until` holds. */
function advance(s: GameState, until: (s: GameState) => boolean): GameState {
  const rank = (a: Action) =>
    a.type === 'block' && a.blocker === null
      ? 0
      : a.type === 'endCounter'
        ? 1
        : a.type === 'optional' && a.accept
          ? 2
          : a.type === 'trigger' && !a.activate
            ? 3
            : a.type === 'pick'
              ? 4
              : a.type === 'done'
                ? 5
                : 9;
  for (let i = 0; i < 20 && !until(s); i++) {
    const a = legalActions(s)
      .filter((x) => x.type !== 'concede')
      .sort((x, y) => rank(x) - rank(y))[0];
    if (!a) throw new Error('no action');
    s = act(s, a);
  }
  return s;
}

/** The sorted biases of the moves `pred` selects (ids in a ranking are the search's, not the test's). */
const biases = (rows: { actions: Action[]; bias: number }[], pred: (a: Action[]) => boolean) =>
  rows
    .filter((r) => pred(r.actions))
    .map((r) => Math.round(r.bias * 1000) / 1000)
    .sort((x, y) => x - y);

const ROCKS = 'OP17-039';
function turnOf(
  leader: string,
  life: string,
  turn: number,
  don: number,
  p1: Partial<Spec['p1']>,
  p2: Partial<Spec['p2']> = {},
): GameState {
  return start({
    seed: 5,
    turn,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader,
      life: lifeOf(leader === 'OP12-061' ? 4 : 5, life),
      costArea: { active: don, rested: 0 },
      decklist: listOf(leader),
      ...p1,
    },
    p2: {
      leader: ROCKS,
      hand: [],
      life: lifeOf(5, 'OP17-050'),
      costArea: { active: Math.min(10, don + 1), rested: 0 },
      decklist: listOf(ROCKS),
      ...p2,
    },
  });
}

const isGive = (a: Action[]) => a[0]!.type === 'giveDon' && a.length === 1;
const isPick = (a: Action[]) => a[0]!.type === 'pick';
const isAttack = (a: Action[]) => a.some((x) => x.type === 'attack');

const pickOfCharacters = (x: GameState) => {
  const d = queries.decision(x);
  const acts = legalActions(x).filter((a) => a.type === 'pick');
  return d?.kind === 'choose' && acts.length > 0 && acts.every((a) => typeof a.choice === 'string');
};

describe('group 3 bias kinds', () => {
  it('activate: the leader’s surge gets its bonus and nothing else does', () => {
    const s = turnOf('OP15-058', 'OP15-061', 3, 2, {
      characters: ['OP15-061'],
      hand: ['OP15-075'],
    });
    const rows = biasOf(s);
    expect(biases(rows, (a) => a[0]!.type === 'activate')).toEqual([1.5]);
    expect(biases(rows, (a) => a[0]!.type !== 'activate')).toEqual(
      rows.filter((r) => r.actions[0]!.type !== 'activate').map(() => 0),
    );
  });

  it('giveDonLeader: DON!! on Sabo gets the bonus once a cost-12 Character and 3 attackers are out', () => {
    const big = turnOf('OP13-004', 'OP17-082', 7, 7, {
      characters: ['OP17-089', 'OP17-080', 'OP17-087'],
    });
    // The Leader's DON!! carries the bonus; DON!! on a body does not.
    const withBig = biases(biasOf(big), isGive);
    expect(withBig).toContain(1.0);
    expect(withBig).toContain(0);
    const small = turnOf('OP13-004', 'OP17-082', 7, 7, {
      characters: ['OP17-080', 'OP17-087', 'OP17-095'],
    });
    expect(new Set(biases(biasOf(small), isGive))).toEqual(new Set([0]));
  });

  it('attackWith with minDon: only the Character carrying given DON!! gets the bonus', () => {
    const s = turnOf('OP15-058', 'OP15-061', 7, 3, {
      characters: [{ card: 'OP15-067', don: 3 }, 'OP15-061'],
    });
    const attacks = biases(biasOf(s), isAttack);
    expect(attacks).toContain(1.0);
    expect(attacks).toContain(0);
  });

  it('activateBefore: the discount paired with a Law is a move of its own; a Law alone is penalised', () => {
    const s = turnOf('OP12-061', 'EB04-058', 3, 4, { hand: ['P-093', 'ST10-010', 'OP16-064'] });
    const on = rank(s, 'p1', true);
    const off = rank(s, 'p1', false);
    const pair = (r: { actions: Action[] }) =>
      r.actions.length === 2 &&
      r.actions[0]!.type === 'activate' &&
      r.actions[1]!.type === 'playCard';
    // Only P-093 pays (its refund condition holds after DON!! -1); ST10-010 is playable at full cost.
    expect(on.filter(pair).length).toBe(1);
    expect(off.filter(pair).length).toBe(0);
    const rows = biasOf(s);
    // Koby (cost 1) is no Law: unchanged. P-093 alone: -1.5 for skipping the discount, +0.8 from
    // the play bias (seed 2); ST10-010 alone: no penalty (the discount does not pay), +0.8.
    const plays = biases(rows, (a) => a.length === 1 && a[0]!.type === 'playCard');
    expect(plays).toEqual([-0.7, 0, 0.8]);
    // The activation on its own gets the bonus (a Law in hand is affordable after it).
    expect(biases(rows, (a) => a.length === 1 && a[0]!.type === 'activate')).toEqual([1.0]);
  });

  it('activateBefore: a discount no card in hand needs is not offered at all', () => {
    // 1 DON!! cannot pay even a discounted Law: rollouts would score the bare activation as a
    // free extra turn, so the move is left out.
    const s = turnOf('OP12-061', 'EB04-058', 3, 1, { hand: ['P-093', 'OP16-064'] });
    const moves = (biases: boolean) =>
      rank(s, 'p1', biases).filter((r) => r.actions.some((a) => a.type === 'activate'));
    expect(moves(true)).toEqual([]);
    expect(moves(false).length).toBe(1);
  });

  it('acceptOptional with minLife: the shield is encouraged at 2 Life and up, not at 1', () => {
    const shield = (lives: number) => {
      let s = start({
        seed: 5,
        turn: 6,
        activePlayer: 'p2',
        firstPlayer: 'p1',
        p1: {
          leader: 'OP12-061',
          life: lifeOf(lives, 'EB04-058'),
          characters: [{ card: 'P-093', rested: true }],
          costArea: { active: 0, rested: 5 },
          decklist: listOf('OP12-061'),
        },
        p2: {
          leader: ROCKS,
          life: lifeOf(5, 'OP17-050'),
          characters: ['OP17-049'],
          costArea: { active: 0, rested: 6 },
          decklist: listOf(ROCKS),
        },
      });
      const by = queries.zone(s, 'p2', 'characters')[0]!;
      const law = queries.zone(s, 'p1', 'characters')[0]!;
      s = act(s, { type: 'attack', attacker: by.instance, target: law.instance, player: 'p2' });
      return advance(s, (x) => queries.decision(x)?.source?.ability === 'law-shield');
    };
    const accept = (a: Action[]) =>
      a[0]!.type === 'optional' && (a[0] as { accept: boolean }).accept;
    expect(biases(biasOf(shield(4)), accept)).toEqual([5.5]);
    expect(biases(biasOf(shield(4)), (a) => !accept(a))).toEqual([0]);
    expect(biases(biasOf(shield(1)), accept)).toEqual([0]);
  });

  it('avoidTarget: a cost-2-or-less Character is penalised as removal’s target, a real threat is not', () => {
    let s = turnOf(
      'OP12-061',
      'EB04-058',
      7,
      7,
      { hand: ['OP09-077'] },
      { characters: ['OP17-050', 'OP17-054'] },
    );
    const gum = queries.zone(s, 'p1', 'hand')[0]!;
    s = act(s, { type: 'playCard', card: gum.instance, player: 'p1' });
    s = advance(s, pickOfCharacters);
    expect(biases(biasOf(s), isPick)).toEqual([-2.0, 0]);
  });

  it('avoidTarget: removal is held while no real threat is within its reach', () => {
    const gumPlay = (foes: string[]) =>
      biases(
        biasOf(turnOf('OP12-061', 'EB04-058', 7, 7, { hand: ['OP09-077'] }, { characters: foes })),
        (a) => a[0]!.type === 'playCard',
      );
    // Cheap bodies only: held. A real threat Gum-Gum cannot K.O. (9000 power): held.
    expect(gumPlay(['OP17-050', 'OP17-045'])).toEqual([-2.0]);
    expect(gumPlay(['OP17-050', 'OP17-048'])).toEqual([-2.0]);
    // A real threat within reach (Stussy, 5000): not penalised.
    expect(gumPlay(['OP17-050', 'OP17-054'])).toEqual([0]);
  });

  it('targetCanAttack: the surge’s DON!! prefer a Character that can attack', () => {
    let s = turnOf('OP15-058', 'OP15-061', 5, 2, {
      characters: [{ card: 'OP15-061', rested: true }, 'OP15-067'],
    });
    s = act(
      s,
      legalActions(s).find((a) => a.type === 'activate' && a.ability === 'enel-surge')!,
    );
    s = advance(s, pickOfCharacters);
    expect(biases(biasOf(s), isPick)).toEqual([0, 1.0]);
  });
});
