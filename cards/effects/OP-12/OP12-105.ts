import type { CardScript } from '../../src/dsl.ts';

/** OP12-105 Trafalgar Lammy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_105: CardScript = {
  cardId: 'OP12-105',
  textHash: '10d70473e7a9e9',
  verified: {
    source: 'cards/overrides/OP12-105.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: '[Your Turn] Up to 1 of your [Trafalgar Law] cards gains +2000 power',
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
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Trafalgar Law',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "[Trafalgar Law] cards" on the field are the Leader and Characters (the cards that have power), matched by exact name',
  ],
};
