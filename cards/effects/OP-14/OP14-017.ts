import type { CardScript } from '../../src/dsl.ts';

/** OP14-017 Chambres. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_017: CardScript = {
  cardId: 'OP14-017',
  textHash: '08160267f5f978',
  verified: {
    source: 'cards/overrides/OP14-017.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Select 2 of your opponent's Characters with 9000 base power or less and swap their base power during this turn",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            swapBasePower: {
              a: {
                from: 'characters',
                owner: 'opponent',
                filter: { basePower: { lte: 9000 } },
                pick: { exactly: 1 },
              },
              b: {
                from: 'characters',
                owner: 'opponent',
                filter: { basePower: { lte: 9000 } },
                pick: { exactly: 1 },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "M6b-Q51 (reading, no ruling): each card takes the other's base power as it is now",
    'reading: "9000 base power or less" is checked on base power (not current) when each Character is selected',
  ],
};
