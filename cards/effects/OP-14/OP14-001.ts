import type { CardScript } from '../../src/dsl.ts';

/** OP14-001 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_001: CardScript = {
  cardId: 'OP14-001',
  textHash: '09a96a63289cf8',
  verified: {
    source: 'cards/overrides/OP14-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'swap',
      label:
        'Once per turn: select 2 of your {Supernovas} or {Heart Pirates} Characters and swap their base power during this turn',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            swapBasePower: {
              a: {
                from: 'characters',
                owner: 'you',
                filter: { any: [{ type: 'Supernovas' }, { type: 'Heart Pirates' }] },
                pick: { exactly: 1 },
              },
              b: {
                from: 'characters',
                owner: 'you',
                filter: { any: [{ type: 'Supernovas' }, { type: 'Heart Pirates' }] },
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
    "M6b-Q51 (reading, no ruling): each card takes the other's base power as it is now, as one more base-power setting",
    'reading: with fewer than 2 eligible Characters nothing is selected and nothing is swapped; the Once Per Turn use is still spent',
  ],
};
