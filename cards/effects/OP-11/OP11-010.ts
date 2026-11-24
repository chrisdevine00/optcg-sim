import type { CardScript } from '../../src/dsl.ts';

/** OP11-010 Hibari. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_010: CardScript = {
  cardId: 'OP11-010',
  textHash: '037cff1c2d6edc',
  verified: {
    source: 'cards/overrides/OP11-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Give up to 1 of your opponent's Characters -2000 power this turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'attack',
      label:
        'This Character gains +1000 power this turn; then up to 1 of your {Navy} Leader can also attack active Characters this turn',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'self',
                owner: 'you',
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            canAttackActive: {
              target: {
                from: 'leader',
                owner: 'you',
                filter: {
                  type: 'Navy',
                },
                pick: {
                  upTo: 1,
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is sequential: the Leader grant is not conditional on the +1000; the Leader must have the {Navy} type, and attacks on rested Characters stay legal',
  ],
};
