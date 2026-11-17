import type { CardScript } from '../../src/dsl.ts';

/** OP15-061 Ohm. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_061: CardScript = {
  cardId: 'OP15-061',
  textHash: '146e9df04c4036',
  verified: {
    source: 'cards/overrides/OP15-061.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'DON!! -1: draw 1',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label: "With 6 or less DON!!, give up to 1 of your opponent's Characters -1000 power",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          cmp: [
            {
              donOnField: 'you',
            },
            '<=',
            6,
          ],
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
