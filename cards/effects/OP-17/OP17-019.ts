import type { CardScript } from '../../src/dsl.ts';

/** OP17-019 I Don't Have Time to Chat with Snot-Nosed Brats. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_019: CardScript = {
  cardId: 'OP17-019',
  textHash: '02606ffba1bf4c',
  verified: {
    source: 'cards/overrides/OP17-019.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 5 cards from the top of your deck; reveal up to 1 "Whitebeard Pirates" card and add it to your hand; place the rest at the bottom in any order',
      kind: 'activate',
      when: 'main',
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
                    typeIncludes: 'Whitebeard Pirates',
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
    {
      id: 'trigger',
      label: 'Your Leader gains +1000 power during this turn',
      kind: 'trigger',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
