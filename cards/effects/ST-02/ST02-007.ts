import type { CardScript } from '../../src/dsl.ts';

/** ST02-007 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST02_007: CardScript = {
  cardId: 'ST02-007',
  textHash: '00b22a84ad9cf4',
  verified: {
    source: 'cards/overrides/ST02-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'search',
      label:
        '(1) You may rest this Character: look at 5; reveal up to 1 {Supernovas} card and add it to your hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restDon: 1 }, { restSelf: true }],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                { pick: { upTo: 1 }, filter: { type: 'Supernovas' }, reveal: true, to: 'hand' },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: ['reading: both costs are paid on activation; an already rested Bonney cannot activate'],
};
