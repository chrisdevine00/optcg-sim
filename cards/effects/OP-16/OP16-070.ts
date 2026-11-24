import type { CardScript } from '../../src/dsl.ts';

/** OP16-070 Donquixote Rosinante. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_070: CardScript = {
  cardId: 'OP16-070',
  textHash: '19dc91f0cd769a',
  verified: {
    source: 'cards/overrides/OP16-070.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'Rest 2 DON!!: with a {Navy} Leader add up to 1 rested DON!!',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          restDon: 2,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Navy',
            },
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};
