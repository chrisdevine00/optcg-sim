import type { CardScript } from '../../src/dsl.ts';

/** OP18-080 Van Augur. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_080: CardScript = {
  cardId: 'OP18-080',
  textHash: '1d048d8d2b2c1e',
  verified: {
    source: 'cards/overrides/OP18-080.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'draw',
      label:
        "[Your Turn] [Once Per Turn] When a card is trashed from your hand by your [Marshall.D.Teach] Leader's effect, if you have no other [Van Augur], draw 1 card",
      kind: 'auto',
      oncePerTurn: true,
      conditions: [
        {
          yourTurn: true,
        },
      ],
      when: [
        {
          event: 'trashedFromHand',
          owner: 'you',
          by: 'you',
          sourceFilter: {
            name: 'Marshall.D.Teach',
          },
          includeCosts: true,
        },
      ],
      effect: [
        {
          if: {
            none: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    name: 'Van Augur',
                  },
                  {
                    not: {
                      isSelf: true,
                    },
                  },
                ],
              },
            },
          },
          then: [
            {
              do: {
                draw: 1,
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
  rulings: [
    "audit Q6 (proposed reading): a card trashed from the hand as the cost of your [Marshall.D.Teach] Leader's effect counts (a cost is part of the effect; M6b-Q31, `includeCosts`); `sourceFilter` is the Leader named Marshall.D.Teach",
    'reading (B3A-R1): the colon-less "if you have no other [Van Augur]" is an effect condition read when the draw resolves, on your Characters, this one excluded; the Once Per Turn is spent when it fails',
  ],
};
