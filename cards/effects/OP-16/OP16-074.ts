import type { CardScript } from '../../src/dsl.ts';

/** OP16-074 Magellan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_074: CardScript = {
  cardId: 'OP16-074',
  textHash: '126142e4cb84f6',
  verified: {
    source: 'cards/overrides/OP16-074.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the {Impel Down} type, your opponent returns 1 DON!! from their field to their DON!! deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { type: 'Impel Down' } },
          then: [{ do: { returnDon: { n: 1, player: 'opponent' } } }],
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Your opponent returns 4 DON!! from their field to their DON!! deck',
      kind: 'auto',
      when: ['onKO'],
      effect: [{ do: { returnDon: { n: 4, player: 'opponent' } } }],
    },
  ],
  rulings: [
    'QA-OP16 OP16-074 (rulings.md): the opponent chooses which of their DON!!; as many as they have when fewer (M6b-Q45)',
  ],
};
