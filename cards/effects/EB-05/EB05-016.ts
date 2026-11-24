import type { CardScript } from '../../src/dsl.ts';

/** EB05-016 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_016: CardScript = {
  cardId: 'EB05-016',
  textHash: '0fe267113869c8',
  verified: {
    source: 'cards/overrides/EB05-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Your Turn: play up to 1 Character card with a cost of 5 or less and the "Wisdom" attribute from your hand',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      cost: {
                        lte: 5,
                      },
                    },
                    {
                      attribute: 'Wisdom',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Rest up to 1 of your opponent's Characters with a cost of 6 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 6,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
