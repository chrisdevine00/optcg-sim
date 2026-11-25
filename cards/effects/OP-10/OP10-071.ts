import type { CardScript } from '../../src/dsl.ts';

/** OP10-071 Donquixote Doflamingo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_071: CardScript = {
  cardId: 'OP10-071',
  textHash: '1ec18e24127200',
  verified: {
    source: 'cards/overrides/OP10-071.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'DON!! -1: play up to 1 {Donquixote Pirates} Character card with a cost of 5 or less from your hand',
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
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Donquixote Pirates',
                    },
                    {
                      cost: {
                        lte: 5,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
    {
      id: 'opp-attack',
      label:
        'Once per turn, when your opponent attacks: you may rest 1 of your DON!! cards: add up to 1 DON!! card from your DON!! deck and set it as active',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [
        {
          restDon: 1,
        },
      ],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
};
