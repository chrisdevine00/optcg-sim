import type { CardScript } from '../../src/dsl.ts';

/** PRB02-016 Otama. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_016: CardScript = {
  cardId: 'PRB02-016',
  textHash: '1476afad317a55',
  verified: {
    source: 'cards/overrides/PRB02-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Rest this Character and add 1 card from the top or bottom of your Life to your hand: up to 1 of your Leader or Character cards gains +3000 power during this turn',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restSelf: true }, { lifeToHand: { from: 'topOrBottom', n: 1 } }],
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Rest up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 4 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
