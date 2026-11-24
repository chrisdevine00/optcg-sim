import type { CardScript } from '../../src/dsl.ts';

/** OP15-059 Amazon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_059: CardScript = {
  cardId: 'OP15-059',
  textHash: '14ef1c3df6c6ba',
  verified: {
    source: 'cards/overrides/OP15-059.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-attack',
      label:
        'You may rest this Character: your opponent may return 1 of their active DON!!; if they do not, give up to 1 of their Leader or Character cards -2000 power',
      kind: 'auto',
      when: ['onOpponentAttack'],
      cost: [{ restSelf: true }],
      effect: [
        {
          if: { cmp: [{ donOnField: 'opponent', state: 'active' }, '>=', 1] },
          then: [
            {
              chooseOne: [
                [{ do: { returnDon: { n: 1, player: 'opponent', from: 'active' } } }],
                [
                  {
                    do: {
                      power: {
                        target: {
                          from: ['leader', 'characters'],
                          owner: 'opponent',
                          pick: { upTo: 1 },
                        },
                        amount: -2000,
                        duration: 'thisTurn',
                      },
                    },
                  },
                ],
              ],
              chooser: 'opponent',
              labels: [
                'Return 1 of your active DON!! cards to your DON!! deck.',
                'Give up to 1 of your Leader or Character cards -2000 power during this turn.',
              ],
              neutral: [
                "Amazon's opponent returns 1 of their active DON!! cards.",
                "Amazon's player gives 1 of their opponent's Leader or Characters -2000 power.",
              ],
            },
          ],
          else: [
            {
              do: {
                power: {
                  target: { from: ['leader', 'characters'], owner: 'opponent', pick: { upTo: 1 } },
                  amount: -2000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q45): with no active DON!! the opponent cannot return one, so they "do not" and the -2000 happens with no choice offered; with one or more active the opponent chooses the mode',
    "reading: the -2000 target (up to 1 of the opponent's Leader or Characters) is chosen by Amazon's controller after the opponent's choice",
  ],
};
