import type { CardScript } from '../../src/dsl.ts';

/** OP09-003 Shachi & Penguin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_003: CardScript = {
  cardId: 'OP09-003',
  textHash: '13503cdb1a69c8',
  verified: {
    source: 'cards/overrides/OP09-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label: "Give up to 1 of your opponent's Characters -2000 power during this turn",
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
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
