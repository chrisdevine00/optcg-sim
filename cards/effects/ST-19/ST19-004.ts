import type { CardScript } from '../../src/dsl.ts';

/** ST19-004 Hina. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST19_004: CardScript = {
  cardId: 'ST19-004',
  textHash: '1385ee4ba0a0e7',
  verified: {
    source: 'cards/overrides/ST19-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-turn-cost',
      label: "[DON!! x1] [Opponent's Turn] This Character gains +4 cost",
      kind: 'permanent',
      conditions: [{ donGiven: 1 }, { opponentsTurn: true }],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: 4 } }],
    },
    {
      id: 'activate',
      label:
        'You may place 1 card from your trash at the bottom of your deck: give up to 1 rested DON!! card to your Leader or 1 of your Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          move: { from: 'trash', owner: 'you', pick: { exactly: 1 } },
          to: { zone: 'deck', position: 'bottom' },
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading: the +4 cost applies during the opponent's turn only and needs 1 or more DON!! given to this Character (it counts the DON!! as it is now, CR 8-3-2-3)",
  ],
};
