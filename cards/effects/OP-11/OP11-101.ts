import type { CardScript } from '../../src/dsl.ts';

/** OP11-101 Capone"Gang"Bege. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_101: CardScript = {
  cardId: 'OP11-101',
  textHash: '00b31f2281d1bc',
  verified: {
    source: 'cards/overrides/OP11-101.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'shield',
      label:
        'If your "Supernovas" type Character other than [Capone"Gang"Bege] would be removed from the field by your opponent\'s effect, you may add it to the top of your Life cards face-down instead',
      kind: 'replacement',
      oncePerTurn: true,
      optional: true,
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            all: [
              {
                type: 'Supernovas',
              },
              {
                not: {
                  name: 'Capone"Gang"Bege',
                },
              },
            ],
          },
        },
        cause: 'opponentEffect',
      },
      instead: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'you',
                filter: {
                  ref: 'replaced',
                },
                pick: {
                  exactly: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
                faceUp: false,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (G61, M6b-Q78): any removal from the field by your opponent\'s effect (K.O., trash, return to hand or deck) of another "Supernovas" Character of yours may be replaced; the Character is added to the top of your Life face-down, a removal of its own that is not replaced again',
    'reading: [Once Per Turn] is used only when the replacement is accepted; Bege cannot protect himself ("other than"); the exclusion is by name, so another copy of [Capone"Gang"Bege] is not protected either',
  ],
};
