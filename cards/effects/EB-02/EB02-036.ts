import type { CardScript } from '../../src/dsl.ts';

/** EB02-036 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_036: CardScript = {
  cardId: 'EB02-036',
  textHash: '05f6708c0cc77e',
  verified: {
    source: 'cards/overrides/EB02-036.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label: 'DON!! -1: look at 3, add up to 1 {Straw Hat Crew} card; rest to the bottom',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Straw Hat Crew',
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
    'reading: the DON!! -1 is an optional cost (an auto with a cost is optional, CR 8-3-1-4); "a {Straw Hat Crew} type card" is any category',
  ],
};
