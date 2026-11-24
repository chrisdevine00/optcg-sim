import type { CardScript } from '../../src/dsl.ts';

/** OP12-084 Emporio.Ivankov. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_084: CardScript = {
  cardId: 'OP12-084',
  textHash: '0ebaa79efa0d93',
  verified: {
    source: 'cards/overrides/OP12-084.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'With a Revolutionary Army Leader: trash 3 cards from the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Revolutionary Army',
            },
          },
          then: [
            {
              do: {
                mill: {
                  player: 'you',
                  n: 3,
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
