import type { CardScript } from '../../src/dsl.ts';

/** OP14-075 Lao.G. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_075: CardScript = {
  cardId: 'OP14-075',
  textHash: '10129958d1f72b',
  verified: {
    source: 'cards/overrides/OP14-075.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        "Add up to 1 DON!! rested, then give up to 1 of your opponent's Characters -2000 power during this turn",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'rested',
                upTo: true,
              },
            ],
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
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
