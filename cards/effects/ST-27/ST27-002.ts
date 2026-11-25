import type { CardScript } from '../../src/dsl.ts';

/** ST27-002 Catarina Devon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST27_002: CardScript = {
  cardId: 'ST27-002',
  textHash: '04413031712889',
  verified: {
    source: 'cards/overrides/ST27-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trash-self',
      label:
        "You may trash this Character: if your Leader has {Blackbeard Pirates}, give up to 1 of your opponent's Characters -1 cost during this turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [{ trashSelf: true }],
      effect: [
        {
          if: { leader: { type: 'Blackbeard Pirates' } },
          then: [
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
    },
    {
      id: 'on-ko',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [{ do: { draw: 1 } }],
    },
  ],
  rulings: [
    'reading: the "If" follows the cost colon: with another Leader this Character is trashed and nothing happens; trashing it is not a K.O., so [On K.O.] does not fire; the -1 is not clamped',
  ],
};
