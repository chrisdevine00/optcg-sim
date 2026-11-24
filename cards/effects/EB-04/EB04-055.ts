import type { CardScript } from '../../src/dsl.ts';

/** EB04-055 Bartholomew Kuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_055: CardScript = {
  cardId: 'EB04-055',
  textHash: '1ca8c78e31c9cc',
  verified: {
    source: 'cards/overrides/EB04-055.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Play up to 1 {Revolutionary Army} Character with cost 4 or less from your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Revolutionary Army',
                    },
                    {
                      cost: {
                        lte: 4,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'With a {Revolutionary Army} Leader and 5 or less total Life, play this card',
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
};
