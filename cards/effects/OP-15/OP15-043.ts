import type { CardScript } from '../../src/dsl.ts';

/** OP15-043 Kelly Funk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_043: CardScript = {
  cardId: 'OP15-043',
  textHash: '17d75df624be64',
  verified: {
    source: 'cards/overrides/OP15-043.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Play up to 1 [Bobby Funk] from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: { name: 'Bobby Funk' },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};
