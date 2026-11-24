import type { CardScript } from '../../src/dsl.ts';

/** OP11-002 Ain. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_002: CardScript = {
  cardId: 'OP11-002',
  textHash: '00dec10565f79b',
  verified: {
    source: 'cards/overrides/OP11-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Give up to 1 opponent's Character -1000 power this turn, then K.O. up to 1 of their Characters with 0 power or less",
      kind: 'auto',
      when: ['onPlay'],
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
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                power: {
                  lte: 0,
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
  rulings: [
    'reading: "Then" is sequential, not "If you do": the K.O. is chosen even if no power was given; "0 power or less" reads current power, so the Character just lowered (or a base 0 Character) qualifies',
  ],
};
