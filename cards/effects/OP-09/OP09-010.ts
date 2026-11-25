import type { CardScript } from '../../src/dsl.ts';

/** OP09-010 Bonk Punch. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_010: CardScript = {
  cardId: 'OP09-010',
  textHash: '1901aefffb2dbb',
  verified: {
    source: 'cards/overrides/OP09-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Play up to 1 [Monster] from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  name: 'Monster',
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label: '[DON!! x1] This Character gains +2000 power during this turn',
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 1,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'self',
                owner: 'you',
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
