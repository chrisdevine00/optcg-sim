import type { CardScript } from '../../src/dsl.ts';

/** ST36-003 Scratchmen Apoo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST36_003: CardScript = {
  cardId: 'ST36-003',
  textHash: '0893cc4a5f8940',
  verified: {
    source: 'cards/overrides/ST36-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label: "Draw 1 card and your {Supernovas} Leader's base power becomes 7000 during this turn",
      kind: 'trigger',
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            setBasePower: {
              target: { from: 'leader', owner: 'you', filter: { type: 'Supernovas' } },
              value: 7000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: the draw happens whether or not the Leader has the {Supernovas} type; only the base power part needs it',
  ],
};
