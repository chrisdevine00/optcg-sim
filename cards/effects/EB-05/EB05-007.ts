import type { CardScript } from '../../src/dsl.ts';

/** EB05-007 Monet. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_007: CardScript = {
  cardId: 'EB05-007',
  textHash: '035398a211a63c',
  verified: {
    source: 'cards/overrides/EB05-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may reveal a total of 3 Event or {Punk Hazard} type cards from your hand: draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              any: [
                {
                  category: ['Event'],
                },
                {
                  type: 'Punk Hazard',
                },
              ],
            },
            pick: {
              exactly: 3,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
    {
      id: 'end-boost',
      label: "This Character gains +5000 power until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'self',
                owner: 'you',
              },
              amount: 5000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: ['reading: "a total of 3" is any mix of Events and {Punk Hazard} type cards, 3 in all'],
};
