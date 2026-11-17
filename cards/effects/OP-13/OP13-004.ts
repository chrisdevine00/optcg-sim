import type { CardScript } from '../../src/dsl.ts';

/** OP13-004 Sabo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_004: CardScript = {
  cardId: 'OP13-004',
  textHash: '179ed5a6ca03b3',
  verified: {
    source: 'cards/overrides/OP13-004.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'life-malus',
      label: 'With 4 or more Life, this Leader gives itself -1000 power',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              life: 'you',
            },
            '>=',
            4,
          ],
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: -1000,
          },
        },
      ],
    },
    {
      id: 'big-leader',
      label: '[DON!! x1] With a Character of cost 8 or more, your Leader and Characters gain +1000',
      kind: 'permanent',
      conditions: [
        {
          donGiven: 1,
        },
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              cost: {
                gte: 8,
              },
            },
          },
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: ['leader', 'characters'],
              owner: 'you',
            },
            amount: 1000,
          },
        },
      ],
    },
  ],
  rulings: [
    'RL-51 OP13-004 (no per-card Q&A in QA-OP13): both parts are permanent effects, re-checked on every change, on either turn',
    'reading: the "Character with a cost of 8 or more" is one of your own Characters (the text says "you have")',
  ],
};
