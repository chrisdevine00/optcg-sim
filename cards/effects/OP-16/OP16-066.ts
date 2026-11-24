import type { CardScript } from '../../src/dsl.ts';

/** OP16-066 Sengoku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_066: CardScript = {
  cardId: 'OP16-066',
  textHash: '12ff2c1d42d22f',
  verified: {
    source: 'cards/overrides/OP16-066.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'With a {Navy} Leader: add up to 2 rested DON!!, draw 2, trash 2',
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
                    n: 2,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
            {
              do: {
                draw: 2,
              },
            },
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: {
                    exactly: 2,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
