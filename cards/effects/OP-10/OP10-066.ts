import type { CardScript } from '../../src/dsl.ts';

/** OP10-066 Giolla. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_066: CardScript = {
  cardId: 'OP10-066',
  textHash: '16ffdac95d84aa',
  verified: {
    source: 'cards/overrides/OP10-066.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-attack',
      label:
        "Once per turn: you may rest 2 of your DON!! cards: rest up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [
        {
          restDon: 2,
        },
      ],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 4,
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
};
