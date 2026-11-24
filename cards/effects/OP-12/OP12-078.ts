import type { CardScript } from '../../src/dsl.ts';

/** OP12-078 Brochette Blow. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_078: CardScript = {
  cardId: 'OP12-078',
  textHash: '0512b74d831486',
  verified: {
    source: 'cards/overrides/OP12-078.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "If your DON!! count is at most your opponent's: draw 1, then -3000 power to up to 1 opposing Character",
      kind: 'activate',
      when: 'main',
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
                  amount: -3000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" after a failed "If" does not resolve (M4b-5), so the -3000 is inside the guard; the DON!! on the field are the cost area plus given DON!! for both players',
  ],
};
