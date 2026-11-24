import type { CardScript } from '../../src/dsl.ts';

/** EB05-038 Russian. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_038: CardScript = {
  cardId: 'EB05-038',
  textHash: '18d67341e11981',
  verified: {
    source: 'cards/overrides/EB05-038.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Up to 1 of your [Senor Pink] gains +3000 power this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Senor Pink',
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
