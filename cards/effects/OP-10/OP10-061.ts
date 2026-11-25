import type { CardScript } from '../../src/dsl.ts';

/** OP10-061 Special Long-Range Attack!! Bagworm. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_061: CardScript = {
  cardId: 'OP10-061',
  textHash: '13b7c025df5b8a',
  verified: {
    source: 'cards/overrides/OP10-061.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Draw 1 card; then return up to 1 of your opponent's Characters with a cost of 2 or less to the owner's hand",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 2,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Return up to 1 Character with a cost of 2 or less to the owner's hand",
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 2,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the [Trigger] may return any Character, yours or the opponent\'s, as the text says "up to 1 Character"',
  ],
};
