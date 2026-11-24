import type { CardScript } from '../../src/dsl.ts';

/** EB03-032. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_032: CardScript = {
  cardId: 'EB03-032',
  textHash: '1a6761272105c0',
  verified: {
    source: 'cards/overrides/EB03-032.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Your turn: up to 1 of your [Charlotte Katakuri] cards gains +2000 power during this turn',
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
                  name: 'Charlotte Katakuri',
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
    'reading: "your [Charlotte Katakuri] cards" are the Leader or Characters with exactly that name',
  ],
};
