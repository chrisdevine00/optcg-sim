import type { CardScript } from '../../src/dsl.ts';

/** OP10-065 Sugar. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_065: CardScript = {
  cardId: 'OP10-065',
  textHash: '17e00dc3a1b29c',
  verified: {
    source: 'cards/overrides/OP10-065.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'search',
      label:
        'You may rest 1 of your DON!! cards and this Character: look at 5; reveal up to 1 {Donquixote Pirates} card and add it to your hand; rest to the bottom',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restDon: 1,
        },
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Donquixote Pirates',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: one cost of both parts on an [Activate: Main] (activating is already optional), so it cannot be used while this Character is rested; the searched card may be of any category',
  ],
};
