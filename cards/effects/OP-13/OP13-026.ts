import type { CardScript } from '../../src/dsl.ts';

/** OP13-026 Sunny-Kun. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_026: CardScript = {
  cardId: 'OP13-026',
  textHash: '0f71fea93387ff',
  verified: {
    source: 'cards/overrides/OP13-026.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Rest 1 DON!!: this Character gains +2000 power until the end of the opponent's next turn",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          restDon: 1,
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
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};
