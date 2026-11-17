import type { CardScript } from '../../src/dsl.ts';

/** OP08-115 The Earth Will Not Lose!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP08_115: CardScript = {
  cardId: 'OP08-115',
  textHash: '0f3d2c6cb5ef1d',
  verified: {
    source: 'cards/overrides/OP08-115.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'If your Leader is {Shandian Warrior}, +3000 power during this battle; play up to 1 [Upper Yard] from your hand',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: { leader: { type: 'Shandian Warrior' } },
          then: [
            {
              do: {
                power: {
                  target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
                  amount: 3000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: { name: 'Upper Yard' },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'trigger',
      effect: [
        { do: { draw: 2 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
      ],
    },
  ],
  rulings: [
    'Reading: the "If your Leader ..." condition governs only the +3000; "Then, play" is not gated on it (docs/research/m4b-wave2/kalgara.md)',
  ],
};
