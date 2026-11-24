import type { CardScript } from '../../src/dsl.ts';

/** ST32-002 Kouzuki Oden. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST32_002: CardScript = {
  cardId: 'ST32-002',
  textHash: '1e165b97ea168b',
  verified: {
    source: 'cards/overrides/ST32-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Draw 1 card and up to 1 of your opponent's Characters with a base cost of 6 or less cannot be rested until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
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
                  baseCost: {
                    lte: 6,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              what: 'cannotBeRested',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: unscoped "cannot be rested" (digest 57): it cannot attack, block, pay a rest cost or be rested by any effect; "Draw 1 card and ..." is a sequence',
  ],
};
