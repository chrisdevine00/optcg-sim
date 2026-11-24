import type { CardScript } from '../../src/dsl.ts';

/** OP11-062 Charlotte Katakuri. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_062: CardScript = {
  cardId: 'OP11-062',
  textHash: '18f55e91f4bf5e',
  verified: {
    source: 'cards/overrides/OP11-062.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label:
        "DON!! -1: look at 1 card from the top of your opponent's deck; this Leader gains +1000 power during this battle",
      kind: 'auto',
      oncePerTurn: true,
      when: ['whenAttacking', 'onOpponentAttack'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 1,
              player: 'opponent',
              take: [],
              rest: 'stay',
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: 'self',
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
    'reading: DON!! -1 is the optional DON!! -X cost (RL-52); "Then" is not "If you do" -- the boost follows the look even when the opponent\'s deck is empty',
  ],
};
