import type { CardScript } from '../../src/dsl.ts';

/** OP16-069 Donquixote Doflamingo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_069: CardScript = {
  cardId: 'OP16-069',
  textHash: '0be002021c20cb',
  verified: {
    source: 'cards/overrides/OP16-069.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play-attack',
      label: 'Add up to 1 active DON!!',
      kind: 'auto',
      when: ['onPlay', 'whenAttacking'],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
};
