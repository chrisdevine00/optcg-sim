import type { CardScript } from '../../src/dsl.ts';

/** EB05-054 Charlotte Brulee. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_054: CardScript = {
  cardId: 'EB05-054',
  textHash: '12b4de40f4ce40',
  verified: {
    source: 'cards/overrides/EB05-054.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label: 'Play up to 2 {Big Mom Pirates} Character cards with 4000 power from your hand',
      kind: 'trigger',
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
                      type: 'Big Mom Pirates',
                    },
                    {
                      power: {
                        eq: 4000,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 2,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
