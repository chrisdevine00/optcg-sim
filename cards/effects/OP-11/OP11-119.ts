import type { CardScript } from '../../src/dsl.ts';

/** OP11-119 Koby. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_119: CardScript = {
  cardId: 'OP11-119',
  textHash: '0060cbaf846a11',
  verified: {
    source: 'cards/overrides/OP11-119.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label: 'Up to 1 of your Characters can also attack active Characters during this turn',
      effect: [
        {
          do: {
            canAttackActive: {
              target: {
                from: 'characters',
                owner: 'you',
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
    {
      id: 'when-attacking',
      label:
        "You may place 2 cards from your trash at the bottom of your deck in any order: up to 1 of your Leader or Character cards gains +1000 power until the end of your opponent's next turn",
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [
        {
          move: {
            from: 'trash',
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
          to: {
            zone: 'deck',
            position: 'bottom',
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};
