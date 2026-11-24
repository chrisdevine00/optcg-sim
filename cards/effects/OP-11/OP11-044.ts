import type { CardScript } from '../../src/dsl.ts';

/** OP11-044 Vinsmoke Judge. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_044: CardScript = {
  cardId: 'OP11-044',
  textHash: '19abe8232173e8',
  verified: {
    source: 'cards/overrides/OP11-044.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'power',
      label:
        'You may trash 1 card from your hand: all your {GERMA 66} Characters gain +1000 power during this turn',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'GERMA 66',
                },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
