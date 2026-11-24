import type { CardScript } from '../../src/dsl.ts';

/** OP11-025 Ishilly. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_025: CardScript = {
  cardId: 'OP11-025',
  textHash: '0bfff4c4e74cdf',
  verified: {
    source: 'cards/overrides/OP11-025.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-attack',
      label:
        'You may rest 1 DON!! and this Character: up to 1 of your Leader or Character cards gains +1000 power during this battle',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [
        {
          restDon: 1,
        },
        {
          restSelf: true,
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
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
