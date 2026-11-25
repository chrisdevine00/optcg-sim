import type { CardScript } from '../../src/dsl.ts';

/** ST18-001 Uso-Hachi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST18_001: CardScript = {
  cardId: 'ST18-001',
  textHash: '1077cbab62fcc5',
  verified: {
    source: 'cards/overrides/ST18-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If you have 8 or more DON!! cards on your field, rest up to 1 of your opponent's Characters with a cost of 5 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { cmp: [{ donOnField: 'you' }, '>=', 8] },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { cost: { lte: 5 } },
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
    'reading: "If" has no colon, so it is an effect condition (an `if` step, B3A-R1); the DON!! count is the field total (cost area plus given), 8 exactly passes; the cost filter is the current cost',
  ],
};
