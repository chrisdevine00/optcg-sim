import type { CardScript } from '../../src/dsl.ts';

/** OP09-009 Benn.Beckman. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_009: CardScript = {
  cardId: 'OP09-009',
  textHash: '1e06aa2ea905a3',
  verified: {
    source: 'cards/overrides/OP09-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Trash up to 1 of your opponent's Characters with 6000 power or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  power: {
                    lte: 6000,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'trash',
              },
            },
          },
        },
      ],
    },
  ],
};
