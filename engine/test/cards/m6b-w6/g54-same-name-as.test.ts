/**
 * M6b wave 6, G54: the filter `sameNameAs` a card an earlier selector bound (EB02-039 GERMA 66:
 * "trash 1 ... Character card from your hand: ... play up to 1 Character card with 5000 to 7000
 * power and the same card name as the trashed card from your trash"). The cost selector binds the
 * trashed card; the play reads its name. Planted on vanilla cards; each test fails with the gap
 * reverted.
 */
import { describe, expect, it } from 'vitest';
import { validateScript } from '@optcg/cards';
import { withAlsoNamed, withAbilities } from '../../../src/testing.ts';
import { game, PLAIN_BLUE, PLAIN_PURPLE, pick, V } from '../helpers.ts';
import { errorsOf, main } from '../m6b-w1/probe.ts';
import { cards } from '../../fixtures/index.ts';

const trashCost = {
  trash: {
    from: 'hand',
    owner: 'you',
    filter: { all: [{ category: ['Character'] }, { power: { lte: 4000 } }] },
    pick: { exactly: 1 },
    bind: 't',
  },
};
const playSame = {
  do: {
    play: {
      what: {
        from: 'trash',
        owner: 'you',
        filter: {
          all: [
            { category: ['Character'] },
            { power: { gte: 5000 } },
            { power: { lte: 7000 } },
            { sameNameAs: 't' },
          ],
        },
        pick: { upTo: 1 },
      },
    },
  },
};

/** The probe card is p1's Leader-side Character V.c1; hand V.c2 (4000), trash V.c3, V.c4, V.c5. */
const mk = (trash: string[] = [V.c3, V.c4, V.c5], hand: string[] = [V.c2]) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [V.c1], hand, trash, costArea: { active: 5, rested: 0 } },
    { leader: PLAIN_BLUE },
  );
  g.state = withAbilities(g.state, V.c1, [main([playSame] as never, [trashCost] as never)]);
  return g;
};
const nameOf = (id: string): string => cards()(id)!.name;
/** Activate the probe and pay its cost with the hand card (the hand is secret, so it is asked). */
const probe = (g: ReturnType<typeof mk>, costCard: string = V.c2) => {
  g.act({ type: 'activate', card: g.find('p1', 'characters', V.c1), ability: 'a' });
  pick(g, [g.find('p1', 'hand', costCard)]);
};

describe('G54 the same card name as a bound card', () => {
  it('validates, and refuses the nonsense', () => {
    main([playSame] as never, [trashCost] as never);
    const bad = (cost: unknown[], e: unknown[]) =>
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        ...(cost.length ? { cost } : {}),
        effect: e,
      });
    // The name is read from a card an earlier selector bound.
    expect(bad([], [playSame])).not.toEqual([]);
    expect(bad([{ trash: { ...trashCost.trash, bind: 'other' } }], [playSame])).not.toEqual([]);
    // A deck restriction reads printed values of deck cards: nothing is bound there.
    const deck = (f: unknown) =>
      validateScript({
        cardId: 'OP02-060',
        textHash: 'x',
        verified: { source: 't', date: '2026-11-25' },
        rules: [{ deckRestriction: f }],
        abilities: [],
      } as never);
    expect(deck({ cost: { gte: 5 } })).toEqual([]);
    expect(deck({ sameNameAs: 't' })).not.toEqual([]);
  });

  it('plays a card with the same name as the card that was trashed', () => {
    // V.c4 is given the name of V.c2 "under the rules of this game" (a card with a printed name
    // shared by two cards of different power, as GERMA 66's Characters are).
    const g = mk();
    g.state = withAlsoNamed(g.state, V.c4, [nameOf(V.c2)]);
    probe(g);
    pick(g, [g.find('p1', 'trash', V.c4)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c1, V.c4]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(V.c2);
  });

  it('offers only the cards that share the name: the others are not candidates', () => {
    const g = mk();
    g.state = withAlsoNamed(g.state, V.c4, [nameOf(V.c2)]);
    probe(g);
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(1);
  });

  it('with no card of that name in the trash nothing can be played', () => {
    const g = mk();
    probe(g);
    // The trash holds no candidate, so there is nothing to ask: the effect ends.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(g.legal().some((a) => a.type === 'endTurn')).toBe(true);
  });

  it('the same card in the trash is the same name (two copies of one card)', () => {
    const g = mk([V.c3], [V.c3]);
    // The cost needs 4000 power or less: V.c3 is 5000. Use a window the copy fits.
    g.state = withAbilities(g.state, V.c1, [
      main(
        [
          {
            do: {
              play: {
                what: {
                  from: 'trash',
                  owner: 'you',
                  filter: { all: [{ category: ['Character'] }, { sameNameAs: 't' }] },
                  pick: { upTo: 1 },
                },
              },
            },
          },
        ] as never,
        [
          {
            trash: { from: 'hand', owner: 'you', pick: { exactly: 1 }, bind: 't' },
          },
        ] as never,
      ),
    ]);
    probe(g, V.c3);
    // Two copies are now in the trash: the older one and the one just trashed.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
  });

  it('a selection that chose nothing names nothing, so nothing matches', () => {
    const g = mk();
    g.state = withAlsoNamed(g.state, V.c4, [nameOf(V.c2)]);
    g.state = withAbilities(g.state, V.c1, [
      main([
        {
          do: {
            select: {
              from: 'hand',
              owner: 'you',
              filter: { cost: { gte: 9 } },
              pick: { upTo: 1 },
              bind: 't',
            },
          },
        },
        playSame,
      ] as never),
    ]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', V.c1), ability: 'a' });
    // The select asks (the hand is secret) and is answered with nothing; then the play has no candidate.
    g.act({ type: 'done' });
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    expect(g.legal().some((a) => a.type === 'endTurn')).toBe(true);
  });
});
