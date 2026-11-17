import type { CardScript } from '../../src/dsl.ts';

/** OP09-062 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_062: CardScript = {
  cardId: 'OP09-062',
  textHash: '1a1e8d0d1e43f9',
  verified: {
    source: 'cards/overrides/OP09-062.json (card text in cards/data)',
    date: '2026-11-16',
  },
  keywords: ['Banish'],
  abilities: [
    {
      id: 'when-attacking',
      label: 'Trash 1 card with a [Trigger]: add 1 rested DON!! from your DON!! deck',
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              hasTrigger: true,
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
  rulings: [
    'RL-50 (rulings.md): no per-card Q&A; the cost can be paid with an empty DON!! deck, the added DON!! enters rested',
  ],
};
