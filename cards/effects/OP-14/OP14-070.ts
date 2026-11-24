import type { CardScript } from '../../src/dsl.ts';

/** OP14-070 Buffalo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_070: CardScript = {
  cardId: 'OP14-070',
  textHash: '04d85589131904',
  verified: {
    source: 'cards/overrides/OP14-070.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'rested',
      label:
        "When this Character becomes rested by your opponent's Character's effect, you may return 1 DON!! to your DON!! deck: set this Character as active",
      kind: 'auto',
      when: [
        {
          event: 'rested',
          owner: 'you',
          filter: {
            isSelf: true,
          },
          by: 'opponentEffect',
          sourceFilter: {
            category: ['Character'],
          },
        },
      ],
      effect: [
        {
          may: [
            {
              do: {
                returnDon: {
                  n: 1,
                },
              },
            },
          ],
          label: 'return',
        },
        {
          ifDid: 'return',
          then: [
            {
              do: {
                setActive: {
                  from: 'self',
                  owner: 'you',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    "reading (M6b-Q10, Q30): only an effect of an opponent's Character card counts (not their Leader, Event or Stage, not an attack or a cost); the DON!! return is a may step, not a cost",
  ],
};
