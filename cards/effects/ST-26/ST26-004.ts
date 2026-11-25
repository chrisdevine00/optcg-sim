import type { CardScript } from '../../src/dsl.ts';

/** ST26-004 General Franky. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST26_004: CardScript = {
  cardId: 'ST26-004',
  textHash: '10070ba92aca4c',
  verified: {
    source: 'cards/overrides/ST26-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "DON!! -2: give up to 2 of your opponent's Characters -2000 power during this turn",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ donMinus: 2 }],
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 2 } },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: DON!! -2 is the optional DON!! -X cost (RL-52); "up to 2" may choose 0, 1 or 2 different Characters; the -2000 is not clamped',
  ],
};
