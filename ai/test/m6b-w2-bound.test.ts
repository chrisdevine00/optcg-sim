/**
 * M6b wave 2 and the lethal search (ai/src/search/lethal): a replacement of damage (D4) changes how
 * much Life a hit takes, so a defender that has one must never be proven lethal on a bound that
 * ignores it. The search runs the real engine, which offers the defender the replacement, so a hit
 * that the defender can replace is not a proven lethal; a play from a look at the top adds attacks.
 */
import { describe, expect, it, vi } from 'vitest';
import { projectForSearch, type GameState } from '@optcg/engine';
import { SCRIPTED_IDS, SCRIPTS } from '@optcg/cards';
import { lethal, attackersPossible } from '../src/index.ts';
import { reachOf } from '../src/search/lethal/bound.ts';
import { cardMap } from './support.ts';
import { asVanilla } from './support/vanilla.ts';
import { lifeOf, listOf, start } from './support/scenario.ts';

vi.setConfig({ testTimeout: 120_000 });
asVanilla('OP13-001', 'OP13-027');

const cards = cardMap();
const LUFFY = 'OP13-001'; // a plain 5000 Leader
const SANJI = 'OP13-027'; // 7000, no Counter, vanilla
const ZORO = 'EB04-007'; // 9000, vanilla (the filler Life cards)
const ROCKS = 'OP17-039';

/** The replacement is planted as the vanilla fixture's script, so the public projection keeps it. */
const gloriosa = {
  cardId: SANJI,
  textHash: 'x',
  verified: { source: 't', date: '2026-11-23' },
  abilities: [
    {
      id: 'dmg',
      kind: 'replacement',
      replaces: { damage: 'you' },
      optional: true,
      instead: [{ trashSelf: true }],
    },
  ],
};

/** Only p1's Leader can attack and the defender has 0 Life: one unblocked hit wins, unless replaced. */
function position(withReplacement: boolean): GameState {
  const scripts = SCRIPTS as Record<string, unknown>;
  if (withReplacement) {
    scripts[SANJI] = gloriosa;
    (SCRIPTED_IDS as Set<string>).add(SANJI);
  } else {
    Reflect.deleteProperty(scripts, SANJI);
    (SCRIPTED_IDS as Set<string>).delete(SANJI);
  }
  return start({
    seed: 11,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: LUFFY,
      characters: [],
      life: lifeOf(4, ZORO),
      hand: [],
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
    p2: {
      leader: ROCKS,
      characters: [SANJI],
      life: [],
      hand: [],
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
  });
}

describe('M6b wave 2: lethal against a damage replacement', () => {
  it('without it the single hit at 0 Life is a proven lethal', () => {
    const r = lethal({ mode: 'actual', state: position(false) }, cards, { nodes: 100_000 });
    expect(r.status).toBe('proven');
  });

  it('with it on the defender board the hit is not proven (the defender may replace it)', () => {
    const s = position(true);
    const actual = lethal({ mode: 'actual', state: s }, cards, { nodes: 100_000 });
    expect(actual.status).not.toBe('proven');
    const pub = lethal({ mode: 'public', view: projectForSearch(s, 'p1') }, cards, {
      nodes: 100_000,
    });
    expect(pub.status).not.toBe('proven');
  });

  it('the attacker count bound still holds (a replacement cannot add attackers)', () => {
    expect(attackersPossible(position(true), 'p1', cards)).toBe(true);
  });
});

describe('M6b wave 2: attacks a look at the top can add', () => {
  const plant = (id: string, to: 'play' | 'hand'): void => {
    (SCRIPTS as Record<string, unknown>)[id] = {
      cardId: id,
      abilities: [
        {
          id: 'a',
          kind: 'activate',
          when: 'activateMain',
          effect: [
            {
              do: {
                lookAtTop: { n: 5, take: [{ pick: { upTo: 2 }, to }], rest: 'bottomAnyOrder' },
              },
            },
          ],
        },
      ],
    };
  };
  it('a take that plays counts as extra attacks, like a `play`; a take to hand does not', () => {
    plant('ZZ-PLAY', 'play');
    plant('ZZ-HAND', 'hand');
    try {
      expect(reachOf('ZZ-PLAY').extra).toBe(2);
      expect(reachOf('ZZ-HAND').extra).toBe(0);
    } finally {
      delete (SCRIPTS as Record<string, unknown>)['ZZ-PLAY'];
      delete (SCRIPTS as Record<string, unknown>)['ZZ-HAND'];
    }
  });
});
