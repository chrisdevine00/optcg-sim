import type { CardScript } from '../../src/dsl.ts';

/** OP17-029 Hongo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_029: CardScript = {
  cardId: 'OP17-029',
  textHash: '027a0c2d1bda8b',
  verified: {
    source: 'cards/overrides/OP17-029.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        "Set up to 1 of your DON!! cards as active; then rest up to 2 of your opponent's Characters with a cost of 2 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                upTo: 1,
              },
            },
          },
        },
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 2,
                },
              },
              pick: {
                upTo: 2,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is not "If you do": the rest happens even when no DON!! card could be set active',
  ],
};
