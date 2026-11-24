import type { CardScript } from '../../src/dsl.ts';

/** OP15-117 Heso!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_117: CardScript = {
  cardId: 'OP15-117',
  textHash: '0bbb3f1746c598',
  verified: {
    source: 'cards/overrides/OP15-117.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Draw 1 card; then give up to 1 rested DON!! card to 1 of your {Sky Island} Leader or Character cards',
      kind: 'activate',
      when: 'main',
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { type: 'Sky Island' },
                pick: { exactly: 1 },
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'If your Leader has the {Sky Island} type, draw 2 cards',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { type: 'Sky Island' } },
          then: [{ do: { draw: 2 } }],
        },
      ],
    },
  ],
};
