import type { CardScript } from '../../src/dsl.ts';

/** OP14-023 Kikunojo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_023: CardScript = {
  cardId: 'OP14-023',
  textHash: '1cece5f1edbabc',
  verified: {
    source: 'cards/overrides/OP14-023.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'end-of-turn',
      label: 'Set this Character as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          do: {
            setActive: {
              from: 'self',
              owner: 'you',
            },
          },
        },
      ],
    },
  ],
};
