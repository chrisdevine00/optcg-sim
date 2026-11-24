import type { CardScript } from '../../src/dsl.ts';

/** OP14-015 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_015: CardScript = {
  cardId: 'OP14-015',
  textHash: '0d4a2e9b3d82ae',
  verified: {
    source: 'cards/overrides/OP14-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'when-attacking',
      label: "Give up to 1 of your opponent's Characters -1000 power",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
