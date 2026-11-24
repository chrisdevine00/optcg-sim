import type { CardScript } from '../../src/dsl.ts';

/** OP17-014 Whitey Bay. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_014: CardScript = {
  cardId: 'OP17-014',
  textHash: '18c6e369d5d454',
  verified: {
    source: 'cards/overrides/OP17-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "K.O. up to 1 of your opponent's Characters with 2000 base power or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                basePower: {
                  lte: 2000,
                },
              },
              pick: {
                upTo: 1,
              },
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
};
