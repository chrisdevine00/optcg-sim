import type { CardScript } from '../../src/dsl.ts';

/** OP09-108 Bartholomew Kuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_108: CardScript = {
  cardId: 'OP09-108',
  textHash: '1f1517b6d2744a',
  verified: {
    source: 'cards/overrides/OP09-108.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      kind: 'trigger',
      label: 'With a Revolutionary Army Leader and 5 or less Life cards in total, play this card',
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  type: 'Revolutionary Army',
                },
              },
              {
                cmp: [
                  {
                    life: 'both',
                  },
                  '<=',
                  5,
                ],
              },
            ],
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'self',
                    owner: 'you',
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (as OP10-100): colon-less [Trigger] "If" is an effect condition; the Life total of both players is read as it resolves',
  ],
};
