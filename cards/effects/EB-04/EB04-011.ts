import type { CardScript } from '../../src/dsl.ts';

/** EB04-011 Scaled Neptunian. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_011: CardScript = {
  cardId: 'EB04-011',
  textHash: '0d292434b16a19',
  verified: {
    source: 'cards/overrides/EB04-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush: Character'],
  abilities: [
    {
      id: 'on-play',
      label: 'Draw a card for each of your {Neptunian} Characters, then trash the same number',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: {
              count: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Neptunian',
                },
              },
            },
          },
        },
        {
          forEach: {
            count: {
              from: 'characters',
              owner: 'you',
              filter: {
                type: 'Neptunian',
              },
            },
          },
          do: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: {
                    exactly: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the count includes this Character (it is a {Neptunian} on the field when the [On Play] resolves); the number trashed is the same number counted (recomputed after the draw, which cannot change it); the trashes are mandatory ("Then" is not "if you do") and picked one at a time',
  ],
};
