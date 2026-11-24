import type { CardScript } from '../../src/dsl.ts';

/** EB04-053 Sentomaru. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_053: CardScript = {
  cardId: 'EB04-053',
  textHash: '01b06115238a00',
  verified: {
    source: 'cards/overrides/EB04-053.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-block',
      label: 'With 2 or less Life, draw 1 card',
      kind: 'auto',
      when: ['onBlock'],
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
              2,
            ],
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
  ],
};
