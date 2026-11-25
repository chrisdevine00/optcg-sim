import type { CardScript } from '../../src/dsl.ts';

/** PRB02-011 Donquixote Doflamingo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_011: CardScript = {
  cardId: 'PRB02-011',
  textHash: '1e56a80391fee1',
  verified: {
    source: 'cards/overrides/PRB02-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is multicolored, add up to 1 DON!! card from your DON!! deck and rest it',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { multicolor: true } },
          then: [{ do: { addDon: [{ n: 1, state: 'rested', upTo: true }] } }],
        },
      ],
    },
  ],
  rulings: [
    'reading: "up to 1" asks a count (None or 1) when the DON!! deck has a card (E-Q11 for "add up to N DON!!")',
  ],
};
