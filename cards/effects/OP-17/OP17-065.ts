import type { CardScript } from '../../src/dsl.ts';

/** OP17-065 Queen. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_065: CardScript = {
  cardId: 'OP17-065',
  textHash: '1d59e3f2fd29b0',
  verified: {
    source: 'cards/overrides/OP17-065.json (card text in cards/data)',
    date: '2026-10-28',
  },
  keywords: ['Banish'],
  abilities: [
    {
      id: 'on-play',
      label: "Draw 1; up to 2 of your opponent's Characters with a cost of 5 or less cannot attack",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 5,
                  },
                },
                pick: {
                  upTo: 2,
                },
              },
              what: 'cannotAttack',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};
