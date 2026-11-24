import type { CardScript } from '../../src/dsl.ts';

/** OP12-060 Boeuf Burst. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_060: CardScript = {
  cardId: 'OP12-060',
  textHash: '0f240a4f81b2a0',
  verified: {
    source: 'cards/overrides/OP12-060.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'If your Leader is multicolored, choose one',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: { leader: { multicolor: true } },
          then: [
            {
              chooseOne: [
                [
                  {
                    do: {
                      move: {
                        what: {
                          from: 'characters',
                          owner: 'opponent',
                          filter: { cost: { lte: 4 } },
                          pick: { upTo: 1 },
                        },
                        to: { zone: 'hand' },
                      },
                    },
                  },
                ],
                [{ if: { cmp: [{ hand: 'you' }, '<=', 6] }, then: [{ do: { draw: 2 } }] }],
              ],
              labels: [
                "Return up to 1 of your opponent's Characters with a cost of 4 or less to the owner's hand",
                'If you have 6 or less cards in your hand, draw 2 cards',
              ],
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Reading (E-Q6): the "If your Leader is multicolored" gates the whole choice; a mode may be chosen and do nothing (a hand of 7 or more); the hand count is read when the draw resolves, after the Event has left the hand',
  ],
};
