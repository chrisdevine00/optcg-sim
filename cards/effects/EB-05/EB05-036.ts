import type { CardScript } from '../../src/dsl.ts';

/** EB05-036 Tsuru. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_036: CardScript = {
  cardId: 'EB05-036',
  textHash: '0ff18f825e1a59',
  verified: {
    source: 'cards/overrides/EB05-036.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'With a {Navy} Leader: draw 1 and add up to 1 rested DON!!',
      kind: 'auto',
      when: ['onPlay'],
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
                draw: 1,
              },
            },
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
