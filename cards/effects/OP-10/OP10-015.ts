import type { CardScript } from '../../src/dsl.ts';

/** OP10-015 Mocha. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_015: CardScript = {
  cardId: 'OP10-015',
  textHash: '0280c7614ed13e',
  verified: {
    source: 'cards/overrides/OP10-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Give up to 1 of your opponent's Characters -1000 power",
      kind: 'auto',
      when: ['onPlay'],
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
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
