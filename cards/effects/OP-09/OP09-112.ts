import type { CardScript } from '../../src/dsl.ts';

/** OP09-112 Belo Betty. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_112: CardScript = {
  cardId: 'OP09-112',
  textHash: '126f1e1f2aa882',
  verified: {
    source: 'cards/overrides/OP09-112.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: '[On Play] With 2 or less Life cards, draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
              2,
            ],
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'With a Revolutionary Army Leader and 5 or less Life cards in total, play this card',
      kind: 'trigger',
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
    'reading: both "If"s have no cost colon, so they are effect conditions read when the effect resolves: [On Play] with 3 or more Life draws nothing; a failing [Trigger] does not play the card',
    'reading: the Life total at the [Trigger] is read after the damage that revealed it (the revealed card is already out of the Life area), as OP10-100',
  ],
};
