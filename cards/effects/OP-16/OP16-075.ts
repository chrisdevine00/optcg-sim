import type { CardScript } from '../../src/dsl.ts';

/** OP16-075 Monkey.D.Garp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_075: CardScript = {
  cardId: 'OP16-075',
  textHash: '15bca195e66911',
  verified: {
    source: 'cards/overrides/OP16-075.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'With a {Navy} Leader: add up to 1 active DON!! and up to 1 additional rested DON!!',
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
                addDon: [
                  {
                    n: 1,
                    state: 'active',
                    upTo: true,
                  },
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
