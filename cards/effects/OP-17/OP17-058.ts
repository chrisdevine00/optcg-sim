import type { CardScript } from '../../src/dsl.ts';

/** OP17-058 Kaido (Leader). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_058: CardScript = {
  cardId: 'OP17-058',
  textHash: '0cb5147bf020a4',
  verified: {
    source: 'cards/overrides/OP17-058.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'shrink',
      label: "Give up to 1 of your opponent's Characters −2000 power",
      kind: 'auto',
      when: ['whenAttacking', 'onOpponentAttack'],
      oncePerTurn: true,
      cost: [
        {
          donMinus: 1,
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
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'RL-45',
    'RL-34',
    'QA-OP17 OP17-058: declining on one attack keeps it for a later attack that turn',
  ],
};
