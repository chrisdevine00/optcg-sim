import type { CardScript } from '../../src/dsl.ts';

/** OP09-114 Lindbergh. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_114: CardScript = {
  cardId: 'OP09-114',
  textHash: '08aa9f01848b66',
  verified: {
    source: 'cards/overrides/OP09-114.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "[On Play] With 5 or less Life cards in total, K.O. up to 1 of your opponent's Characters with 2000 power or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'both',
              },
              '<=',
              5,
            ],
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    power: {
                      lte: 2000,
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
      ],
    },
    {
      id: 'trigger',
      label: 'With 5 or less Life cards in total, play this card',
      kind: 'trigger',
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'both',
              },
              '<=',
              5,
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
    'reading: "2000 power or less" is current power (buffs, debuffs and given DON!! count); an Opponent Character at 0 power matches',
    'reading: both "If"s have no cost colon: effect conditions read when the effect resolves, as OP10-100',
  ],
};
