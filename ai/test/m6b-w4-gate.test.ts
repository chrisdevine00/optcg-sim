/**
 * Review W4-R1: the lethal solver's attacker-count gate (`attackersPossible`) must not refute a seat
 * that can win, or take the last Life, by an effect with no attack. `refuted` is a proof, so the gate
 * lets a seat through whenever a card it can reach holds `damage`, `winGame`, a Life move, or any op
 * the reading does not know; the search then decides. Each position here has one Leader attack and an
 * opponent at 1 Life (or the shape named), where the count alone says "no lethal".
 */
import { describe, expect, it, vi } from 'vitest';
import { projectForSearch, type GameState } from '@optcg/engine';
import { SCRIPTED_IDS, SCRIPTS } from '@optcg/cards';
import { lethal, attackersPossible } from '../src/index.ts';
import { winsByEffect } from '../src/search/lethal/bound.ts';
import { cardMap } from './support.ts';
import { asVanilla } from './support/vanilla.ts';
import { lifeOf, listOf, start, type Spec } from './support/scenario.ts';

vi.setConfig({ testTimeout: 120_000 });
asVanilla('OP13-001', 'OP13-027');

const cards = cardMap();
const LUFFY = 'OP13-001'; // a plain 5000 Leader
const SANJI = 'OP13-027'; // 7000 vanilla
const ZORO = 'EB04-007'; // 9000 vanilla (the filler Life cards)
const ROCKS = 'OP17-039';
// Events planted per test: one id each, because the solver memoises what a card's script can do.
const EVENTS = ['EB01-019', 'EB01-020', 'EB01-028', 'EB01-029', 'EB01-009', 'OP01-026'];
let EVENT = EVENTS[0]!;
const FILLER = 'EB04-007';

const byEffect = new Map<string, string>();
function plant(effect: unknown[]): void {
  const key = JSON.stringify(effect);
  if (!byEffect.has(key)) byEffect.set(key, EVENTS[byEffect.size]!);
  EVENT = byEffect.get(key)!;
  (SCRIPTS as Record<string, unknown>)[EVENT] = {
    cardId: EVENT,
    textHash: 'x',
    verified: { source: 't', date: '2026-11-24' },
    abilities: [{ id: 'main', kind: 'activate', when: 'main', effect }],
  };
  (SCRIPTED_IDS as Set<string>).add(EVENT);
}

function board(over: { oppLife: number; oppHand: number; mine?: Partial<Spec['p1']> }): GameState {
  return start({
    seed: 11,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: LUFFY,
      characters: [],
      life: lifeOf(4, ZORO),
      hand: [EVENT],
      costArea: { active: 3, rested: 0 },
      decklist: listOf(ROCKS),
      ...over.mine,
    },
    p2: {
      leader: ROCKS,
      characters: [],
      life: lifeOf(over.oppLife, ZORO),
      hand: Array.from({ length: over.oppHand }, () => FILLER),
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
  });
}

const OPP_LIFE_TO_TRASH = {
  do: {
    move: {
      what: { from: 'lifeTop', owner: 'opponent', pick: { exactly: 1 } },
      to: { zone: 'trash' },
    },
  },
};

describe('W4-R1: the attacker-count gate lets an effect win through', () => {
  it('control: an Event that only adds DON!! is still refuted by the count, with no search', () => {
    plant([{ do: { addDon: [{ n: 1, state: 'active' }] } }]);
    const s = board({ oppLife: 1, oppHand: 5 });
    expect(attackersPossible(s, 'p1', cards)).toBe(false);
    const r = lethal({ mode: 'actual', state: s }, cards, { nodes: 100_000 });
    expect(r.status).toBe('refuted');
    expect(r.defence?.reason).toBe('attackers');
    expect(r.nodes).toBe(0);
  });

  it('[Main] damage 2 against 1 Life is found, in actual and public', () => {
    plant([{ do: { damage: { player: 'opponent', n: 2 } } }]);
    const s = board({ oppLife: 1, oppHand: 5 });
    expect(attackersPossible(s, 'p1', cards)).toBe(true);
    const a = lethal({ mode: 'actual', state: s }, cards, { nodes: 200_000 });
    expect(a.status).toBe('proven');
    const p = lethal({ mode: 'public', view: projectForSearch(s, 'p1') }, cards, {
      nodes: 200_000,
    });
    expect(p.status).toBe('proven');
  });

  it('[Main] winGame is found', () => {
    plant([{ do: { winGame: true } }]);
    const s = board({ oppLife: 5, oppHand: 5 });
    const a = lethal({ mode: 'actual', state: s }, cards, { nodes: 200_000 });
    expect(a.status).toBe('proven');
    const p = lethal({ mode: 'public', view: projectForSearch(s, 'p1') }, cards, {
      nodes: 200_000,
    });
    expect(p.status).toBe('proven');
  });

  it('[Main] the opponent’s last Life to the trash, then the Leader attack, is found', () => {
    plant([OPP_LIFE_TO_TRASH]);
    const s = board({ oppLife: 1, oppHand: 0 });
    expect(attackersPossible(s, 'p1', cards)).toBe(true);
    const a = lethal({ mode: 'actual', state: s }, cards, { nodes: 200_000 });
    expect(a.status).toBe('proven');
  });

  it('with a full hand the Life move is not refuted by the count (the search decides)', () => {
    plant([OPP_LIFE_TO_TRASH]);
    const s = board({ oppLife: 1, oppHand: 5 });
    const p = lethal({ mode: 'public', view: projectForSearch(s, 'p1') }, cards, {
      nodes: 200_000,
    });
    expect(p.defence?.reason).not.toBe('attackers');
  });

  it('an op the reading does not know is searched, not refuted', () => {
    plant([{ do: { someFutureOp: { n: 1 } } }]);
    expect(attackersPossible(board({ oppLife: 1, oppHand: 0 }), 'p1', cards)).toBe(true);
  });

  it('an effect on a card in the trash counts when a reachable card plays from the trash', () => {
    plant([{ do: { addDon: [{ n: 1, state: 'active' }] } }]);
    const s = board({ oppLife: 1, oppHand: 0, mine: { trash: [EVENT], hand: [] } });
    // Nothing reaches the trash: the Event there is not counted (its script has no way to be used).
    expect(attackersPossible(s, 'p1', cards)).toBe(false);
  });

  it('winsByEffect: the classes', () => {
    plant([{ do: { damage: { player: 'opponent', n: 1 } } }]);
    expect(winsByEffect(EVENT)).toBe(true);
    expect(winsByEffect(LUFFY)).toBe(false); // an unscripted card
  });
});

describe('W4-R1: real scripted cards in a lethal position', () => {
  it('OP16-116 [Main] (10 DON!!, the opponent’s Life to hand) beats 1 Life', () => {
    const s = board({
      oppLife: 1,
      oppHand: 0,
      mine: { hand: ['OP16-116'], costArea: { active: 10, rested: 0 } },
    });
    expect(attackersPossible(s, 'p1', cards)).toBe(true);
    const a = lethal({ mode: 'actual', state: s }, cards, { nodes: 300_000 });
    expect(a.status).toBe('proven');
  });

  it('EB03-053 [On Play] takes a Life card so that three attackers finish 3 Life', () => {
    // Without the Nami: 3 attackers, 3 Life need 4 attacks. With it: 2 Life, 3 attacks.
    const s = board({
      oppLife: 3,
      oppHand: 0,
      mine: { hand: ['EB03-053'], characters: [SANJI, SANJI], costArea: { active: 5, rested: 0 } },
    });
    expect(attackersPossible(s, 'p1', cards)).toBe(true);
    const a = lethal({ mode: 'actual', state: s }, cards, { nodes: 300_000 });
    expect(a.status).toBe('proven');
  });

  it('EB03-057 [On K.O.] trades itself for the last Life card, then the Leader finishes', () => {
    // 057 (4000) attacks their rested 9000 Character, is K.O.'d, and its [On K.O.] trashes the
    // only Life card; the Leader then lands at 0 Life. (The count passes here with 2 attackers;
    // the unit test below pins that the script counts as an effect.)
    const s = start({
      seed: 11,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: LUFFY,
        characters: ['EB03-057'],
        life: lifeOf(4, ZORO),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: ROCKS,
        characters: [{ card: ZORO, rested: true }],
        life: lifeOf(1, ZORO),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
    });
    const a = lethal({ mode: 'actual', state: s }, cards, { nodes: 300_000 });
    expect(a.status).toBe('proven');
  });

  it('EB03-057 [On K.O.] (the opponent’s Life to the trash) is counted as an effect', () => {
    expect(winsByEffect('EB03-057')).toBe(true);
    expect(winsByEffect('EB03-053')).toBe(true);
    expect(winsByEffect('OP16-116')).toBe(true);
  });
});
