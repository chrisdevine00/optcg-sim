import type { CardScript } from '../../src/dsl.ts';

/** OP14-081 Spider Mice. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_081: CardScript = {
  cardId: 'OP14-081',
  textHash: '18e135a54ea9e2',
  verified: {
    source: 'cards/overrides/OP14-081.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 3 cards from the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
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
    {
      id: 'on-ko',
      label: "K.O. up to 1 of your opponent's Characters with a base cost of 1",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                baseCost: {
                  eq: 1,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
