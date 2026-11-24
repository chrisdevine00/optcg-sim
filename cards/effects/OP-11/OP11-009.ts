import type { CardScript } from '../../src/dsl.ts';

/** OP11-009 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_009: CardScript = {
  cardId: 'OP11-009',
  textHash: '06ea73580a4798',
  verified: {
    source: 'cards/overrides/OP11-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack-shrink',
      label:
        "[DON!! x2] Give up to 1 of your opponent's Characters -2000 power until the end of your opponent's next turn",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 2,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -2000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};
