import type { CardScript } from '../../src/dsl.ts';

/** OP10-110 Heat & Wire. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_110: CardScript = {
  cardId: 'OP10-110',
  textHash: '15e0cc74ef2723',
  verified: {
    source: 'cards/overrides/OP10-110.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Rest up to 1 of your opponent's Characters with a cost equal to or less than the number of your opponent's Life cards",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: {
                    life: 'opponent',
                  },
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'If you have 2 or less Life cards, play this card',
      kind: 'trigger',
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
