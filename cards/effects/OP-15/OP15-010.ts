import type { CardScript } from '../../src/dsl.ts';

/** OP15-010 Nezumi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_010: CardScript = {
  cardId: 'OP15-010',
  textHash: '06ffc09214d2c2',
  verified: {
    source: 'cards/overrides/OP15-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give-don',
      label:
        "Give up to 1 of your opponent's rested DON!! to their Leader or 1 of their Characters",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              from: 'opponent',
              to: { from: ['leader', 'characters'], owner: 'opponent', pick: { upTo: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q24): the rested DON!! given is the opponent\'s own (the card names "its owner\'s Leader"), taken from their cost area and given to their Leader or a Character; none rested, or nobody chosen, gives nothing',
  ],
};
