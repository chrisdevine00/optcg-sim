import type { CardScript } from '../../src/dsl.ts';

/** OP18-019 Quack!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_019: CardScript = {
  cardId: 'OP18-019',
  textHash: '18a018987910d4',
  verified: {
    source: 'cards/overrides/OP18-019.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'main',
      label:
        "If you have no Characters with 7000 base power or more, give up to 1 of your opponent's Characters -3000 power this turn",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            none: {
              from: 'characters',
              owner: 'you',
              filter: {
                basePower: {
                  gte: 7000,
                },
              },
            },
          },
          then: [
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
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
