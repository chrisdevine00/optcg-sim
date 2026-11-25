import type { CardScript } from '../../src/dsl.ts';

/** OP10-028 Kouzuki Momonosuke. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_028: CardScript = {
  cardId: 'OP10-028',
  textHash: '1f1fb9637a307b',
  verified: {
    source: 'cards/overrides/OP10-028.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'search',
      label:
        'You may rest 2 DON!! and trash this Character: look at 5; reveal up to 2 "The Akazaya Nine" cards and add them to your hand; the rest to the bottom in any order',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restDon: 2,
        },
        {
          trashSelf: true,
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
                    upTo: 2,
                  },
                  filter: {
                    type: 'The Akazaya Nine',
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
};
