import type { CardScript } from '../../src/dsl.ts';

/** OP11-084 Kuzan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_084: CardScript = {
  cardId: 'OP11-084',
  textHash: '08c2ab1834ccb2',
  verified: {
    source: 'cards/overrides/OP11-084.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label: 'Trash 3 cards from the top of your deck',
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
      id: 'when-attacking',
      label:
        'Up to 1 of your "Navy" Leader or Character cards can also attack active Characters during this turn',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            canAttackActive: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
                filter: {
                  type: 'Navy',
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
