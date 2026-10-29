import type { CardScript } from '../../src/dsl.ts';

/** OP17-048 Shiki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_048: CardScript = {
  cardId: 'OP17-048',
  textHash: '15a14d65358854',
  verified: {
    source: 'cards/overrides/OP17-048.json (card text in cards/data)',
    date: '2026-10-28',
  },
  keywords: ['Rush: Character'],
  abilities: [
    {
      id: 'shrink',
      label: "Give up to 1 of your opponent's Characters −3000 power",
      kind: 'auto',
      when: ['whenAttacking', 'onOpponentAttack'],
      oncePerTurn: true,
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              typeIncludes: 'Rocks Pirates',
            },
            pick: {
              exactly: 1,
            },
          },
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
              amount: -3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
