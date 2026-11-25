import type { CardScript } from '../../src/dsl.ts';

/** OP09-032 Donquixote Rosinante. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_032: CardScript = {
  cardId: 'OP09-032',
  textHash: '04f781245654ab',
  keywords: ['Blocker'],
  verified: {
    source: 'cards/overrides/OP09-032.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-attack',
      label: 'Set this Character as active',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      effect: [
        {
          do: {
            setActive: {
              from: 'self',
              owner: 'you',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading: [On Your Opponent's Attack] resolves before the block step, so a rested Rosinante is active again in time to block; Once Per Turn is per turn, not per attack",
  ],
};
