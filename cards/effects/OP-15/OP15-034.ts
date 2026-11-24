import type { CardScript } from '../../src/dsl.ts';

/** OP15-034 Yorki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_034: CardScript = {
  cardId: 'OP15-034',
  textHash: '1b60132c8bf324',
  verified: {
    source: 'cards/overrides/OP15-034.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Your turn: up to 1 of your [Brook] cards gains +2000 power',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [{ yourTurn: true }],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { name: 'Brook' },
                pick: { upTo: 1 },
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
    'reading: "[Brook] cards" are the Leader and Characters named [Brook] (a Stage is never given power)',
  ],
};
