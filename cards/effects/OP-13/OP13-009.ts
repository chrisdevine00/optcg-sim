import type { CardScript } from '../../src/dsl.ts';

/** OP13-009 Curly.Dadan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_009: CardScript = {
  cardId: 'OP13-009',
  textHash: '156f105e1bc6ba',
  verified: {
    source: 'cards/overrides/OP13-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'double-attack',
      label: 'With another Mountain Bandits Character, gains Double Attack',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  type: 'Mountain Bandits',
                },
                {
                  isSelf: false,
                },
              ],
            },
          },
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Double Attack',
          },
        },
      ],
    },
  ],
};
