/**
 * M6b wave 8, D9: an effect that acts on the event's subject (OP16-079 Yamato: "When a {Land of Wano}
 * type Character card is played from your trash, that Character gains [Rush] during this turn"). The
 * selector `lki: 'subject'` names only the card the event is about. Official OP16 Q&A for OP16-079: the
 * Character can still attack when it is then negated (the Rush is the Leader's effect, not its own).
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, game, hand, none, PLAIN_BLUE, PLAIN_PURPLE, pick, V } from '../helpers.ts';
import { errorsOf, expectValid } from '../m6b-w1/probe.ts';

const subject = (over: object = {}) => ({
  from: 'characters',
  owner: 'you',
  lki: 'subject',
  ...over,
});
const rush = (target: object = subject()) => ({
  do: { grant: { target, keyword: 'Rush', duration: 'thisTurn' } },
});
/** "When a Character card is played from your trash, that Character gains [Rush] during this turn." */
const watcher = (over: object = {}, effect: unknown[] = [rush()]): Ability =>
  ({
    id: 'w',
    kind: 'auto',
    when: [{ event: 'cardPlayed', by: 'you', from: 'trash', filter: { category: ['Character'] } }],
    effect,
    ...over,
  }) as unknown as Ability;

/** "[Activate: Main] play up to 2 Characters from your trash" (the cards' own [On Play] does not matter). */
const playTrash = (n = 1): Ability =>
  ({
    id: 'a',
    kind: 'activate',
    when: 'activateMain',
    effect: [
      {
        do: {
          play: {
            what: {
              from: 'trash',
              owner: 'you',
              filter: { category: ['Character'] },
              pick: { upTo: n },
            },
          },
        },
      },
    ],
  }) as unknown as Ability;
const playHand: Ability = {
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  effect: [
    {
      do: {
        play: {
          what: {
            from: 'hand',
            owner: 'you',
            filter: { category: ['Character'] },
            pick: { upTo: 1 },
          },
        },
      },
    },
  ],
} as unknown as Ability;

const mk = (ab: Ability = playTrash(), leader: Ability = watcher()) => {
  const g = game(
    {
      leader: PLAIN_BLUE,
      characters: [BLUE, V.c1],
      trash: [V.c2, V.c3],
      hand: [V.c4],
      costArea: { active: 2, rested: 0 },
    },
    { leader: PLAIN_PURPLE, characters: [V.c5] },
  );
  g.state = withAbilities(g.state, BLUE, [ab]);
  g.state = withAbilities(g.state, PLAIN_BLUE, [leader]);
  return g;
};
const run = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
/** Can p1's Character `card` attack the opponent's Leader now? */
const canAttack = (g: ReturnType<typeof mk>, card: string): boolean =>
  g
    .legal()
    .some(
      (a) =>
        a.type === 'attack' &&
        a.attacker === g.find('p1', 'characters', card) &&
        a.target === g.leader('p2'),
    );

describe('D9 the event’s subject', () => {
  it('validates, and only where a card was played', () => {
    expectValid([watcher()]);
    // Another timing has no played card to name.
    expect(errorsOf(watcher({ when: ['onPlay'] }))).not.toEqual([]);
    expect(errorsOf(watcher({ when: [{ event: 'eventActivated', by: 'you' }] }))).not.toEqual([]);
    expect(errorsOf(watcher({ when: ['onPlay', { event: 'cardPlayed', by: 'you' }] }))).not.toEqual(
      [],
    ); // one timing has none
    // An activate ability has no event either.
    expect(
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: [rush()] }),
    ).not.toEqual([]);
    // The subject is one card, not a chosen set.
    expect(errorsOf(watcher({}, [rush(subject({ pick: { upTo: 2 } }))]))).not.toEqual([]);
    expect(errorsOf(watcher({}, [rush(subject({ blind: true }))]))).not.toEqual([]);
    expect(errorsOf(watcher({}, [rush(subject({ lki: 'target' }))]))).not.toEqual([]);
  });

  it('that Character gains Rush: it can attack the turn it is played from the trash', () => {
    const g = mk();
    run(g);
    pick(g, [g.find('p1', 'trash', V.c2)]);
    expect(canAttack(g, V.c2)).toBe(true);
    // Only that Character: the one already there was not touched (it is not summoning sick either),
    // and a Character played another way gets nothing.
    const h = mk(playHand);
    run(h);
    pick(h, [h.find('p1', 'hand', V.c4)]);
    expect(canAttack(h, V.c4)).toBe(false);
  });

  it('only the card that was played: a Character played from the hand in the same turn gets nothing', () => {
    const both = {
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      effect: [
        playHand.kind === 'activate'
          ? (playHand as unknown as { effect: unknown[] }).effect[0]
          : null,
        (playTrash() as unknown as { effect: unknown[] }).effect[0],
      ],
    } as unknown as Ability;
    const g = mk(both);
    run(g);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    pick(g, [g.find('p1', 'trash', V.c2)]);
    expect(canAttack(g, V.c2)).toBe(true);
    expect(canAttack(g, V.c4)).toBe(false);
  });

  it('two Characters played by one effect each get Rush', () => {
    const g = mk(playTrash(2));
    run(g);
    pick(g, [g.find('p1', 'trash', V.c2), g.find('p1', 'trash', V.c3)]);
    // Each play is its own event with its own subject (the [On Play]s of both are one batch).
    expect(canAttack(g, V.c2)).toBe(true);
    expect(canAttack(g, V.c3)).toBe(true);
  });

  it('a played card that is already gone when the effect resolves is not given anything', () => {
    const g = mk(playTrash(1), watcher({}, [rush(subject({ filter: { cost: { gte: 9 } } }))]));
    run(g);
    pick(g, [g.find('p1', 'trash', V.c2)]);
    expect(canAttack(g, V.c2)).toBe(false); // the selector's own filter still applies to the subject
  });

  it('declining to play anything gives nothing', () => {
    const g = mk();
    run(g);
    none(g);
    expect(hand(g, 'p1')).toEqual([V.c4]);
  });
});
