import type { CardScript } from '../../src/dsl.ts';

/** OP17-033 Lucky.Roux. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_033: CardScript = {
  cardId: 'OP17-033',
  textHash: '113967387d8e42',
  verified: {
    source: 'cards/overrides/OP17-033.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 3; reveal up to 1 card with a type including "Red-Haired Pirates" and add it to your hand',
      kind: 'auto',
      when: ['onPlay'],
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
                    typeIncludes: 'Red-Haired Pirates',
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
      id: 'opp-attack',
      label: "You may trash this Character: rest up to 1 of your opponent's Leader or Characters",
      kind: 'auto',
      when: ['onOpponentAttack'],
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            rest: {
              from: ['leader', 'characters'],
              owner: 'opponent',
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Rest up to 1 of your opponent\'s Leader or Characters" is one target in total',
  ],
};
