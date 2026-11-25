import type { CardScript } from '../../src/dsl.ts';

/** OP10-091 Brook. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_091: CardScript = {
  cardId: 'OP10-091',
  textHash: '0523baa58d55f6',
  verified: {
    source: 'cards/overrides/OP10-091.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "Rest this Character and 1 of your Dressrosa Leader or Stage: K.O. up to 1 of your opponent's Characters with a cost of 1 or less; then trash 2 cards from the top of your deck",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
        {
          rest: {
            from: ['leader', 'stage'],
            owner: 'you',
            filter: {
              type: 'Dressrosa',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 1,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
        {
          do: {
            mill: {
              player: 'you',
              n: 2,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, trash 2 cards from the top of your deck" is not "If you do": it happens whether or not a Character was K.O.\'d',
  ],
};
