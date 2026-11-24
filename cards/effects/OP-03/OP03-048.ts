import type { CardScript } from '../../src/dsl.ts';

/** OP03-048 Nojiko. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP03_048: CardScript = {
  cardId: 'OP03-048',
  textHash: '027e393fa8e01c',
  verified: {
    source: 'cards/overrides/OP03-048.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader is [Nami], return up to 1 of your opponent's Characters with a cost of 5 or less to the owner's hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { name: 'Nami' } },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: { cost: { lte: 5 } },
                    pick: { upTo: 1 },
                  },
                  to: { zone: 'hand' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
