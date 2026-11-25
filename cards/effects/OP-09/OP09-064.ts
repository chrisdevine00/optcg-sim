import type { CardScript } from '../../src/dsl.ts';

/** OP09-064 Killer. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_064: CardScript = {
  cardId: 'OP09-064',
  textHash: '1f5b3711a2a867',
  verified: {
    source: 'cards/overrides/OP09-064.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'DON!! -1: set up to 1 of your {Kid Pirates} Leader as active',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            setActive: {
              from: 'leader',
              owner: 'you',
              filter: {
                type: 'Kid Pirates',
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: DON!! -1 is the optional DON!! -X cost; "up to 1" Leader may be left alone, and a non-{Kid Pirates} Leader is never a candidate',
  ],
};
