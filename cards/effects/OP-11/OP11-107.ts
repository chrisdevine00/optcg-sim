import type { CardScript } from '../../src/dsl.ts';

/** OP11-107 Topknot Neptunian. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_107: CardScript = {
  cardId: 'OP11-107',
  textHash: '1f69305a913779',
  verified: {
    source: 'cards/overrides/OP11-107.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'activate',
      label:
        'If your Leader is [Shirahoshi], you may turn 1 Life card face-down: set this Character as active at the end of this turn',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      conditions: [
        {
          leader: {
            name: 'Shirahoshi',
          },
        },
      ],
      cost: [
        {
          turnLifeFaceDown: 1,
        },
      ],
      effect: [
        {
          delayed: {
            at: 'endOfThisTurn',
          },
          do: [
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
    },
  ],
  rulings: [
    'reading: the leading "If" before the colon is an activation condition (Leader [Shirahoshi]); the set-active happens at the end of the turn whether or not the Character is still rested then',
  ],
};
