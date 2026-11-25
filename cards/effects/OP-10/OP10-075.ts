import type { CardScript } from '../../src/dsl.ts';

/** OP10-075 Foxy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_075: CardScript = {
  cardId: 'OP10-075',
  textHash: '0bf333241cf9a0',
  verified: {
    source: 'cards/overrides/OP10-075.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label: 'Trash this Character: if you have no more DON!! than your opponent, draw 1 card',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '<=',
              {
                donOnField: 'opponent',
              },
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
  ],
  rulings: [
    'reading: "the number of DON!! cards on your field" counts the cost area and DON!! given to cards (rules-digest), for both players, with the cost (trashing this Character) already paid; the "If" is after the colon, so it is an effect condition',
  ],
};
