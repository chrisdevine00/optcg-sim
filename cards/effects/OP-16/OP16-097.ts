import type { CardScript } from '../../src/dsl.ts';

/** OP16-097 Yamato. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_097: CardScript = {
  cardId: 'OP16-097',
  textHash: '11152b8874af7f',
  verified: {
    source: 'cards/overrides/OP16-097.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Add a {Land of Wano} Character (cost 6 or less) from trash to hand, then play a Character (cost 2 or less) from hand',
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
                  all: [
                    { category: ['Character'] },
                    { type: 'Land of Wano' },
                    { cost: { lte: 6 } },
                  ],
                },
                pick: { upTo: 1 },
              },
              to: { zone: 'hand' },
            },
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: { all: [{ category: ['Character'] }, { cost: { lte: 2 } }] },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is not "If you do": the play step happens even if nothing was added; the card just added may be the one played',
  ],
};
