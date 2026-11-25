import type { CardScript } from '../../src/dsl.ts';

/** OP09-100 Karasu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_100: CardScript = {
  cardId: 'OP09-100',
  textHash: '0ff032661aea52',
  verified: {
    source: 'cards/overrides/OP09-100.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
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
    'reading (DECISIONS 2026-11-24, as OP10-100): the [Trigger] "If" has no colon, so it is an effect condition and the card is trashed after a failed Trigger (it is not played); the Life total of both players is read as the Trigger resolves, after the damaging card left the Life',
  ],
};
