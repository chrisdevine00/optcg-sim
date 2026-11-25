import type { CardScript } from '../../src/dsl.ts';

/** OP09-001 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_001: CardScript = {
  cardId: 'OP09-001',
  textHash: '061d94c48e89c9',
  verified: {
    source: 'cards/overrides/OP09-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-attack',
      label:
        "Once per turn, when your opponent attacks: give up to 1 of your opponent's Leader or Character cards -1000 power during this turn",
      kind: 'auto',
      optional: true,
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
