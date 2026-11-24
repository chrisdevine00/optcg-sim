import type { CardScript } from '../../src/dsl.ts';

/** EB03-044 Black Maria. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_044: CardScript = {
  cardId: 'EB03-044',
  textHash: '083177d841bc9d',
  verified: {
    source: 'cards/overrides/EB03-044.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker-grant',
      label: 'If your Leader is multicolored, this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [{ leader: { multicolor: true } }],
      apply: [{ grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } }],
    },
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 [Onigashima Island] and add it to your hand; rest to the bottom; play up to 1 [Onigashima Island] from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: { name: 'Onigashima Island' },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: { name: 'Onigashima Island' },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};
