import type { CardScript } from '../../src/dsl.ts';

/** OP09-028 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_028: CardScript = {
  cardId: 'OP09-028',
  textHash: '15c6f530cb1fe7',
  verified: {
    source: 'cards/overrides/OP09-028.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'You may add 1 Life card (top or bottom) to your hand: play up to 1 {ODYSSEY} or {Straw Hat Crew} Character with a cost of 4 or less from your trash rested',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          lifeToHand: {
            from: 'topOrBottom',
            n: 1,
          },
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      any: [
                        {
                          type: 'ODYSSEY',
                        },
                        {
                          type: 'Straw Hat Crew',
                        },
                      ],
                    },
                    {
                      cost: {
                        lte: 4,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
};
