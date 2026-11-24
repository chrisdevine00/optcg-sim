import type { CardScript } from '../../src/dsl.ts';

/** OP12-008 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_008: CardScript = {
  cardId: 'OP12-008',
  textHash: '13a406810e596a',
  verified: {
    source: 'cards/overrides/OP12-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'opp-attack',
      label:
        "Trash 1 card from your hand: give up to 1 of your opponent's Leader or Character -2000 power",
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
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
                from: ['leader', 'characters'],
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
};
