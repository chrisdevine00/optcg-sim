import type { CardScript } from '../../src/dsl.ts';

/** OP13-034 Brook. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_034: CardScript = {
  cardId: 'OP13-034',
  textHash: '036ad6b32f7bff',
  verified: {
    source: 'cards/overrides/OP13-034.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the {FILM} or {Straw Hat Crew} type, set up to 1 of your DON!! cards as active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { any: [{ type: 'FILM' }, { type: 'Straw Hat Crew' }] } },
          then: [{ do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 1 } } } }],
        },
      ],
    },
  ],
};
