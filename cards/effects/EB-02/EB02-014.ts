import type { CardScript } from '../../src/dsl.ts';

/** EB02-014 Sarfunkel. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_014: CardScript = {
  cardId: 'EB02-014',
  textHash: '041d781c14a095',
  verified: {
    source: 'cards/overrides/EB02-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Play up to 1 [Gaimon] from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  name: 'Gaimon',
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
  rulings: ['reading: any Character named [Gaimon] (there are several cards of that name)'],
};
