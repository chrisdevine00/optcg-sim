/** M4b fix round 1 (app): log words for the new effects, Life names, and the stuck-choose guard. */
import { describe, expect, it } from 'vitest';
import type { GameEvent, ViewCard } from '@optcg/engine';
import type { ModKind } from '../../engine/src/state.ts';
import { describeMove, modifierWords, type Names } from '../src/play/game/text.ts';
import { lifeName } from '../src/play/board/Board.tsx';
import { needsDone } from '../src/play/rail/Decision.tsx';
import { cardMap } from './support.ts';

const cards = cardMap();
const names: Names = { me: 'p1', player: { p1: 'Player 1', p2: 'Player 2' }, hotseat: false };
const NAMI = 'OP01-016';
const ZORO = 'OP01-025';

const ev = (type: string, rest: Record<string, unknown> = {}): GameEvent =>
  ({ type, ...rest }) as GameEvent;
const lines = (events: GameEvent[], life = { p1: 3, p2: 3 }) =>
  describeMove(events, 'p1', { cards, names, life }, 0, false).map((l) => l.text);

describe('every modifier kind has words (review M4b-12)', () => {
  // A Record over ModKind: a kind added to the engine fails typecheck here until it is listed.
  const kinds: Record<ModKind, true> = {
    power: true, // logged as PowerModified, not ModifierAdded
    cost: true,
    basePower: true,
    grant: true,
    cannotBeKOd: true,
    cannotAttack: true,
    negate: true,
    noBlocker: true,
    skipRefresh: true,
    cannotBeRemoved: true,
    cannotDraw: true,
    cannotPlay: true,
    playCost: true,
  };
  it.each(Object.keys(kinds).filter((k) => k !== 'power'))('%s', (kind) => {
    const words = modifierWords(ev('ModifierAdded', { kind, amount: 2000, keyword: 'Rush' }));
    expect(words).not.toBe('');
    expect(words).not.toMatch(/gets an effect/); // the fallback means "no words written"
  });

  it('a modifier line names the card and says what it does', () => {
    expect(
      lines([ev('ModifierAdded', { kind: 'cannotBeKOd', card: NAMI, amount: 0, byEffect: true })]),
    ).toEqual(['Nami cannot be K.O.’d']);
    expect(
      lines([ev('ModifierAdded', { kind: 'cost', card: NAMI, amount: -2, byEffect: true })]),
    ).toEqual(['Nami cost −2']);
  });
});

describe('log lines for the M4b effects', () => {
  it('trashes the rest of a look with names, and puts hidden cards back by count only', () => {
    const out = lines([
      ev('CardsLooked', { count: 5, owner: 'p1', player: 'p1' }),
      ev('CardMoved', { from: 'deck', to: 'trash', owner: 'p1', card: ZORO, reason: 'look' }),
      ev('CardMoved', { from: 'deck', to: 'deck', owner: 'p1', reason: 'look' }),
      ev('CardMoved', { from: 'deck', to: 'deck', owner: 'p1', reason: 'look' }),
    ]);
    expect(out).toEqual([
      'Look at the top 5 of your deck · Trash Roronoa Zoro from the top of your deck · Put 2 cards back in your deck',
    ]);
  });

  it('several trashed cards are one phrase', () => {
    const t = (card: string) =>
      ev('CardMoved', { from: 'deck', to: 'trash', owner: 'p2', card, reason: 'look' });
    expect(lines([t(ZORO), t(NAMI)])).toEqual([
      'Trash 2 from the top of their deck: Roronoa Zoro, Nami',
    ]);
  });

  it('a hidden card put back is never named', () => {
    const out = lines([ev('CardMoved', { from: 'deck', to: 'deck', owner: 'p2', reason: 'look' })]);
    expect(out).toEqual(['Put 1 card back in their deck']);
  });

  it('turning a Life card face-up names it, and look/add to Life show the count', () => {
    expect(
      lines([ev('CardRevealed', { card: NAMI, player: 'p1', from: 'life', reason: 'faceUp' })]),
    ).toEqual(['Turn your Life card face-up: Nami']);
    expect(
      lines([ev('CardMoved', { from: 'deck', to: 'life', owner: 'p1', reason: 'search' })]),
    ).toEqual(['Add a card to your Life · your Life 3 → 4']);
    expect(
      lines([ev('CardMoved', { from: 'hand', to: 'life', owner: 'p2', reason: 'effect' })]),
    ).toEqual(['Add a card to their Life · their Life 3 → 4']);
  });

  it('a K.O. by an effect is one line, not "K.O." and "trashed" (review M4b-16)', () => {
    const out = lines([
      ev('KO', { card: ZORO, owner: 'p2', cause: { kind: 'effect', by: 'p1' } }),
      ev('CardMoved', {
        from: 'characters',
        to: 'trash',
        owner: 'p2',
        card: ZORO,
        cause: { kind: 'effect', by: 'p1' },
      }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toBe('K.O. · Their Roronoa Zoro');
  });

  it('a Character trashed by an effect without a K.O. still has its line', () => {
    const out = lines([
      ev('CardMoved', {
        from: 'characters',
        to: 'trash',
        owner: 'p2',
        card: ZORO,
        cause: { kind: 'effect', by: 'p1' },
      }),
    ]);
    expect(out).toEqual(['Roronoa Zoro trashed']);
  });
});

describe('Life names (review M4b-10)', () => {
  const back = { handle: 'p1.life.0', card: null } as unknown as ViewCard;
  const up = (card: string) => ({ handle: `h${card}`, card, faceUp: true }) as unknown as ViewCard;
  it('says how many are face-up and which', () => {
    expect(lifeName('Your', [back, back, back], cards)).toBe('Your Life, 3 cards, face down');
    expect(lifeName('Your', [up(NAMI), back, back], cards)).toBe(
      'Your Life, 3 cards, 1 face-up: Nami',
    );
    expect(lifeName('Opponent’s', [up(NAMI), up(ZORO)], cards)).toBe(
      'Opponent’s Life, 2 cards, 2 face-up: Nami, Roronoa Zoro',
    );
  });
});

describe('a choose that allows no pick can still be finished (review M4b-05)', () => {
  it('sends done when max is 0, and while more picks are allowed, not once full', () => {
    expect(needsDone(0, 0)).toBe(true);
    expect(needsDone(0, 1)).toBe(true);
    expect(needsDone(1, 3)).toBe(true);
    expect(needsDone(1, 1)).toBe(false);
    expect(needsDone(2, 2)).toBe(false);
  });
});
