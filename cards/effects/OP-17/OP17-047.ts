import type { CardScript } from '../../src/dsl.ts';

/** OP17-047 Shiki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_047: CardScript = {
  cardId: 'OP17-047',
  textHash: '14dd634a7ef4f8',
  verified: {
    source: 'cards/overrides/OP17-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'end-turn',
      label:
        'With 2 or less cards in your hand, your opponent places 1 card from their hand at the bottom of their deck',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'you',
              },
              '<=',
              2,
            ],
          },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'hand',
                    owner: 'opponent',
                    chooser: 'opponent',
                    pick: {
                      exactly: 1,
                    },
                  },
                  to: {
                    zone: 'deck',
                    position: 'bottom',
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" is checked as the effect resolves; the opponent chooses the card from their own hand',
  ],
};
