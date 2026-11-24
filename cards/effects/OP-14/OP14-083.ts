import type { CardScript } from '../../src/dsl.ts';

/** OP14-083 Ms. Wednesday. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_083: CardScript = {
  cardId: 'OP14-083',
  textHash: '078f09ff42da52',
  verified: {
    source: 'cards/overrides/OP14-083.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "You may trash this Character: give up to 1 of your opponent's 0 cost Characters -3000 power during this turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    eq: 0,
                  },
                },
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
  rulings: [
    'reading: "0 cost" is the current cost (a Character modified to 0 counts; one printed at 0 and raised does not)',
  ],
};
