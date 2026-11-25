import type { CardScript } from '../../src/dsl.ts';

/** OP13-025 Koby. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_025: CardScript = {
  cardId: 'OP13-025',
  textHash: '112cb325e0eecd',
  verified: {
    source: 'cards/overrides/OP13-025.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the {FILM} type or the <Strike> attribute, set up to 1 of your DON!! cards as active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { any: [{ type: 'FILM' }, { attribute: 'Strike' }] } },
          then: [
            {
              do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 1 } } },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the quoted "FILM" is the exact type and "Strike" the printed attribute of your Leader (either is enough); the "If" has no colon, so it is an effect condition; "set up to 1" asks a count (0 or 1) and needs a rested DON!!',
  ],
};
