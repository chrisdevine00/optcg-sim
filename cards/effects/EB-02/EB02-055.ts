import type { CardScript } from '../../src/dsl.ts';

/** EB02-055 Jinbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_055: CardScript = {
  cardId: 'EB02-055',
  textHash: '1e05de54298896',
  verified: {
    source: 'cards/overrides/EB02-055.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label:
        'If your Leader has the {Fish-Man} or {Merfolk} type and you have 2 or less Life cards, play this card',
      kind: 'trigger',
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  any: [
                    {
                      type: 'Fish-Man',
                    },
                    {
                      type: 'Merfolk',
                    },
                  ],
                },
              },
              {
                cmp: [
                  {
                    life: 'you',
                  },
                  '<=',
                  2,
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
    'Read: the Life condition is read when the Trigger resolves, after the damage card has left the Life area (so "2 or less" counts the cards that remain); a colon-less "If" is an effect condition (B3A-R1); the Trigger does nothing when it is false',
  ],
};
