import type { CardScript } from '../../src/dsl.ts';

/** OP11-049 Carrot. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_049: CardScript = {
  cardId: 'OP11-049',
  textHash: '122ad28cb8988e',
  verified: {
    source: 'cards/overrides/OP11-049.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 3 cards from the top of your deck and place them at the top or bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [],
              rest: 'topOrBottomAnyOrder',
            },
          },
        },
      ],
    },
    {
      id: 'opp-attack',
      label: 'You may trash this Character: your Leader gains +1000 power during this battle',
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
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 1000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'same reading as OP17-050 Streusen: all the cards go to the top or all to the bottom (topOrBottom is one choice)',
  ],
};
