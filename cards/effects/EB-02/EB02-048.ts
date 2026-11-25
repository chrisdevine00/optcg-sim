import type { CardScript } from '../../src/dsl.ts';

/** EB02-048 Brook. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_048: CardScript = {
  cardId: 'EB02-048',
  textHash: '11fd1707105e89',
  verified: {
    source: 'cards/overrides/EB02-048.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Add up to 1 [Laboon] from your trash to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  name: 'Laboon',
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
      id: 'on-ko',
      label: 'Play up to 1 [Laboon] with a cost of 4 or less from your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      name: 'Laboon',
                    },
                    {
                      cost: {
                        lte: 4,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: [Laboon] is the exact card name; the card added from the trash is not revealed (the text does not say reveal) and the trash is public',
  ],
};
