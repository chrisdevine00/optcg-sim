import type { CardScript } from '../../src/dsl.ts';

/** OP13-014 Portgas.D.Rouge. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_014: CardScript = {
  cardId: 'OP13-014',
  textHash: '18ce61686783c2',
  verified: {
    source: 'cards/overrides/OP13-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label: 'Up to 1 of your [Portgas.D.Ace] cards gains +3000 power',
      kind: 'trigger',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Portgas.D.Ace',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
