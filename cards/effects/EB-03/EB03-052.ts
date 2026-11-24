import type { CardScript } from '../../src/dsl.ts';

/** EB03-052 Shirahoshi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_052: CardScript = {
  cardId: 'EB03-052',
  textHash: '15ae231169ae96',
  verified: {
    source: 'cards/overrides/EB03-052.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Trash this Character: if your Leader is [Shirahoshi], add 1 card from the top of your deck to the top of your Life; then all your {Neptunian} Characters gain +1000 power during this turn',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ trashSelf: true }],
      effect: [
        {
          if: { leader: { name: 'Shirahoshi' } },
          then: [
            {
              do: {
                move: {
                  what: { from: 'deckTop', owner: 'you', pick: { exactly: 1 } },
                  to: { zone: 'life', position: 'top' },
                },
              },
            },
            {
              do: {
                power: {
                  target: { from: 'characters', owner: 'you', filter: { type: 'Neptunian' } },
                  amount: 1000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Reading (M4b-5, RD 121-122): "Then, all of your {Neptunian}..." follows the "If your Leader is [Shirahoshi]" clause, so it sits inside the guard; with another Leader the Character is trashed and nothing else happens',
    'The trashed Shirahoshi is no longer on the field, so she does not receive the +1000 herself (and is not {Neptunian} anyway)',
  ],
};
