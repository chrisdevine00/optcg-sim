import type { CardScript } from '../../src/dsl.ts';

/** OP15-017 Morgan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_017: CardScript = {
  cardId: 'OP15-017',
  textHash: '1e527fe0658c37',
  verified: {
    source: 'cards/overrides/OP15-017.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'give-don',
      label:
        "You may give 1 of your opponent's rested DON!! to 1 of their Characters: give up to 1 rested DON!! to their Leader or 1 of their Characters",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          giveDon: {
            n: 1,
            state: 'rested',
            from: 'opponent',
            to: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
          },
        },
      ],
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
    "reading (M6b-Q24, Q44): as OP15-003, the DON!! are the opponent's own rested ones; [Blocker] is the printed keyword",
  ],
};
