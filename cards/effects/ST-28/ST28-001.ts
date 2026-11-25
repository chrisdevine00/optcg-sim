import type { CardScript } from '../../src/dsl.ts';

/** ST28-001 Ashura Doji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST28_001: CardScript = {
  cardId: 'ST28-001',
  textHash: '126e78330c4e7a',
  verified: {
    source: 'cards/overrides/ST28-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader has the {Land of Wano} type and your opponent has 3 or more Life cards, K.O. up to 1 of your opponent's Characters with a base cost of 5 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            all: [{ leader: { type: 'Land of Wano' } }, { cmp: [{ life: 'opponent' }, '>=', 3] }],
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { baseCost: { lte: 5 } },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "If your Leader ... and your opponent has 3 or more Life cards" follows no colon: an effect condition read when the effect resolves; "base cost" is the printed cost',
  ],
};
