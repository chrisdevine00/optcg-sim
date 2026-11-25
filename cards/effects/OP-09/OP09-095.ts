import type { CardScript } from '../../src/dsl.ts';

/** OP09-095 Laffitte. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_095: CardScript = {
  cardId: 'OP09-095',
  textHash: '0cbeaa693df11d',
  verified: {
    source: 'cards/overrides/OP09-095.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      kind: 'activate',
      when: 'activateMain',
      label:
        'Rest 1 of your DON!! cards and this Character: look at 5 cards from the top of your deck; reveal up to 1 {Blackbeard Pirates} card and add it to your hand, then place the rest at the bottom in any order',
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
                    type: 'Blackbeard Pirates',
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
    'reading: a "Blackbeard Pirates type card" is an exact type of any category (Character, Event or Stage)',
  ],
};
