import type { CardScript } from '../../src/dsl.ts';

/** EB03-017. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_017: CardScript = {
  cardId: 'EB03-017',
  textHash: '14da0ce1609cb7',
  verified: {
    source: 'cards/overrides/EB03-017.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader has the {Supernovas} type, set up to 1 DON!! as active; then up to 1 of your opponent's Characters with a cost of 8 or less cannot be rested until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Supernovas',
            },
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'donCostArea',
                  owner: 'you',
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
            {
              do: {
                restrict: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: {
                      cost: {
                        lte: 8,
                      },
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  what: 'cannotBeRested',
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" after a failed "If" does not resolve (M4b-5): both steps sit inside the Leader-type guard. "Then" is not "If you do": the restriction applies even when no DON!! was set. "Cannot be rested" (G2) also stops the Character attacking and blocking',
  ],
};
