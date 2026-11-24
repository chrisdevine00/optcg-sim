import type { CardScript } from '../../src/dsl.ts';

/** OP14-045 Kuroobi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_045: CardScript = {
  cardId: 'OP14-045',
  textHash: '0dcdb2c9b075d1',
  verified: {
    source: 'cards/overrides/OP14-045.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label:
        'When a card is trashed from your hand by an effect, this Character gains [Rush] during this turn',
      kind: 'auto',
      when: [
        {
          event: 'trashedFromHand',
          owner: 'you',
          includeCosts: true,
        },
      ],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'self',
                owner: 'you',
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
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
  rulings: [
    'Reading (M6b-Q11, Q31): any effect of either player, a cost included (includeCosts: a cost is part of the effect, RD 112, CR 8-1-1; owner decision settling the cost half of M6b-Q31)',
  ],
};
