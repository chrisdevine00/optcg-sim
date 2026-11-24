import type { CardScript } from '../../src/dsl.ts';

/** OP12-091 Poker. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_091: CardScript = {
  cardId: 'OP12-091',
  textHash: '09d6fd2cea9897',
  verified: {
    source: 'cards/overrides/OP12-091.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'smile-power',
      label:
        'Once per turn, place 3 cards from your trash at the bottom of your deck: up to 2 of your SMILE Characters gain +2000 power',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          move: {
            from: 'trash',
            owner: 'you',
            pick: {
              exactly: 3,
            },
          },
          to: {
            zone: 'deck',
            position: 'bottom',
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
                  type: 'SMILE',
                },
                pick: {
                  upTo: 2,
                },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
