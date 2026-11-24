import type { CardScript } from '../../src/dsl.ts';

/** OP17-026 Fugar. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_026: CardScript = {
  cardId: 'OP17-026',
  textHash: '07211d16fbf809',
  verified: {
    source: 'cards/overrides/OP17-026.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "With a {Red-Haired Pirates} Leader, rest up to 1 of your opponent's Characters with a cost of 2 or less",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          if: {
            leader: {
              type: 'Red-Haired Pirates',
            },
          },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 2,
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
    },
    {
      id: 'on-ko',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: ['reading: the Leader-type check is an "if" checked as the effect resolves'],
};
