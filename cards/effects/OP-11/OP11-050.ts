import type { CardScript } from '../../src/dsl.ts';

/** OP11-050 Gotti. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_050: CardScript = {
  cardId: 'OP11-050',
  textHash: '0f186195874177',
  verified: {
    source: 'cards/overrides/OP11-050.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "You may trash 1 {Firetank Pirates} card from your hand: return up to 1 Character with cost 1 or less to the owner's hand or place it at the bottom of their deck",
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              type: 'Firetank Pirates',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          chooseOne: [
            [
              {
                do: {
                  move: {
                    what: {
                      from: 'characters',
                      owner: 'any',
                      filter: {
                        cost: {
                          lte: 1,
                        },
                      },
                      pick: {
                        upTo: 1,
                      },
                    },
                    to: {
                      zone: 'hand',
                    },
                  },
                },
              },
            ],
            [
              {
                do: {
                  move: {
                    what: {
                      from: 'characters',
                      owner: 'any',
                      filter: {
                        cost: {
                          lte: 1,
                        },
                      },
                      pick: {
                        upTo: 1,
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
          ],
          labels: [
            "Return up to 1 Character with a cost of 1 or less to the owner's hand",
            "Place up to 1 Character with a cost of 1 or less at the bottom of the owner's deck",
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (as OP14-062): "A or B" is a choose-one of the two moves, each with its own "up to 1" target (the mode is picked first, then the target); either player\'s Character, this one included',
  ],
};
