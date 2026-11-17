import type { CardScript } from '../../src/dsl.ts';

/** OP12-037 Demon Aura Nine Sword Style Asura Blades Drawn Dead Man's Game. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_037: CardScript = {
  cardId: 'OP12-037',
  textHash: '03424d88a9c209',
  verified: {
    source: 'cards/overrides/OP12-037.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may rest 3 DON!!: rest up to a total of 2 of your opponent's Characters or DON!! cards",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 3,
        },
      ],
      costOptional: true,
      effect: [
        {
          do: {
            rest: {
              from: ['characters', 'donCostArea'],
              owner: 'opponent',
              pick: {
                upTo: 2,
              },
            },
          },
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
  rulings: [
    'DECISIONS 2026-11-09 B-1: an Event worded "You may <cost>:" asks the cost after the card is played and it may be declined',
    'Read: a total of 2 across Characters and DON!!, any split; only active DON!! can be rested (CR 1-3-2-1)',
  ],
};
