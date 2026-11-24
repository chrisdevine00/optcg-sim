import type { CardScript } from '../../src/dsl.ts';

/** OP15-028 Meowban Brothers. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_028: CardScript = {
  cardId: 'OP15-028',
  textHash: '069c91def7ecff',
  verified: {
    source: 'cards/overrides/OP15-028.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader has the {East Blue} type, give up to 1 DON!! from your opponent's cost area to 1 of their Characters",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { type: 'East Blue' } },
          then: [
            {
              do: {
                giveDon: {
                  n: 1,
                  state: 'any',
                  from: 'opponent',
                  to: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q44): the DON!! may be active or rested; the giver chooses the kind when both are there and not all of them go',
  ],
};
