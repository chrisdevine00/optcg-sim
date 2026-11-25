import type { CardScript } from '../../src/dsl.ts';

/** ST19-005 Monkey.D.Garp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST19_005: CardScript = {
  cardId: 'ST19-005',
  textHash: '0f261c080573c5',
  verified: {
    source: 'cards/overrides/ST19-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'activate',
      label:
        "You may place 1 card from your trash at the bottom of your deck: give up to 1 of your opponent's Characters -1 cost during this turn",
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
            cost: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              amount: -1,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
