import type { CardScript } from '../../src/dsl.ts';

/** EB03-008 Hibari. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_008: CardScript = {
  cardId: 'EB03-008',
  textHash: '078d85516fe8d6',
  verified: {
    source: 'cards/overrides/EB03-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack-active',
      label:
        'Up to 1 of your {SWORD} type Leader or Character cards can also attack active Characters during this turn',
      kind: 'auto',
      when: ['onPlay', 'whenAttacking'],
      effect: [
        {
          do: {
            canAttackActive: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { type: 'SWORD' },
                pick: { upTo: 1 },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'shrink',
      label:
        "Once per turn: give up to 1 of your opponent's Characters -1000 power during this turn",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "also attack active Characters" is the grant for the turn; rested Characters and the Leader stay legal targets, and RL-17 (no attack the turn a Character is played) still holds',
  ],
};
