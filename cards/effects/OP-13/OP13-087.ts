import type { CardScript } from '../../src/dsl.ts';

/** OP13-087 Saint Charlos. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_087: CardScript = {
  cardId: 'OP13-087',
  textHash: '09d73b14f3abfa',
  verified: {
    source: 'cards/overrides/OP13-087.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 1 card from the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            mill: {
              player: 'you',
              n: 1,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: mandatory; with an empty deck nothing is trashed (RL-26 applies at the next draw)',
  ],
};
