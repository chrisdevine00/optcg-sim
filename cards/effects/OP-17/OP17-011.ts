import type { CardScript } from '../../src/dsl.ts';

/** OP17-011 Blamenco. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_011: CardScript = {
  cardId: 'OP17-011',
  textHash: '0c809fd98f896a',
  verified: {
    source: 'cards/overrides/OP17-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label:
        "[DON!! x2] [When Attacking] Give up to 1 of your opponent's Characters -4000 power during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 2,
        },
      ],
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
              amount: -4000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
