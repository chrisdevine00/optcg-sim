import type { CardScript } from '../../src/dsl.ts';

/** OP13-118 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_118: CardScript = {
  cardId: 'OP13-118',
  textHash: '0d172642b6bd95',
  verified: {
    source: 'cards/overrides/OP13-118.json (card text in cards/data)',
    date: '2026-11-16',
  },
  keywords: ['Double Attack'],
  abilities: [
    {
      id: 'on-play',
      label:
        'With a multicolored Leader: set up to 4 DON!! active; cannot play base cost 5+ Characters this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              multicolor: true,
            },
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'donCostArea',
                  owner: 'you',
                  pick: {
                    upTo: 4,
                  },
                },
              },
            },
            {
              do: {
                restrict: {
                  target: 'you',
                  what: {
                    cannotPlay: {
                      all: [
                        {
                          category: ['Character'],
                        },
                        {
                          baseCost: {
                            gte: 5,
                          },
                        },
                      ],
                    },
                  },
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
    'reading: "Then, you cannot play ..." follows an "if", so it is skipped when the Leader is not multicolored (CR 4-10-1); alternative: the restriction is unconditional',
  ],
};
