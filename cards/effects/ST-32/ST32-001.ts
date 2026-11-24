import type { CardScript } from '../../src/dsl.ts';

/** ST32-001 Kin'emon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST32_001: CardScript = {
  cardId: 'ST32-001',
  textHash: '0c2082ca882c1a',
  verified: {
    source: 'cards/overrides/ST32-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may rest your <Slash> attribute Leader or 1 of your DON!! cards: draw 2 cards and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          oneOf: [
            [
              {
                rest: {
                  from: 'leader',
                  owner: 'you',
                  filter: {
                    attribute: 'Slash',
                  },
                  pick: {
                    exactly: 1,
                  },
                },
              },
            ],
            [
              {
                restDon: 1,
              },
            ],
          ],
        },
      ],
      effect: [
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
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
