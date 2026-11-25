import type { CardScript } from '../../src/dsl.ts';

/** OP11-116 Merman Combat Ultramarine. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_116: CardScript = {
  cardId: 'OP11-116',
  textHash: '1dc0c0a5f5e4b6',
  verified: {
    source: 'cards/overrides/OP11-116.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Add up to 1 Character with a cost of 6 or less to the top or bottom of the owner's Life cards face-up",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 6,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'topOrBottom',
                faceUp: true,
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        "Add up to 1 of your opponent's Characters with a cost of 4 or less to the top or bottom of the owner's Life cards face-up",
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 4,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'topOrBottom',
                faceUp: true,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (G61): "Add up to 1 Character" is either player\'s Character; it goes to its owner\'s Life, at the top or bottom as you choose, face-up; "up to 1" may pick none',
    "reading: the [Trigger] is the opponent's Characters only, with a cost of 4 or less, to their Life; the Event is then trashed",
  ],
};
