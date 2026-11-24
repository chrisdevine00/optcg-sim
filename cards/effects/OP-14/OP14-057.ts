import type { CardScript } from '../../src/dsl.ts';

/** OP14-057 Don't Worry!! I'm Here!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_057: CardScript = {
  cardId: 'OP14-057',
  textHash: '1defa69a76bf78',
  verified: {
    source: 'cards/overrides/OP14-057.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'All of your {Fish-Man} or {Merfolk} type Leader and Characters gain +1000 power during this turn',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  any: [
                    {
                      type: 'Fish-Man',
                    },
                    {
                      type: 'Merfolk',
                    },
                  ],
                },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 2 cards',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
    },
  ],
};
