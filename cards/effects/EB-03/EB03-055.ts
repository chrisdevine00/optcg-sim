import type { CardScript } from '../../src/dsl.ts';

/** EB03-055 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_055: CardScript = {
  cardId: 'EB03-055',
  textHash: '082271e31d057e',
  verified: {
    source: 'cards/overrides/EB03-055.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 1 card from the top of your Life cards: if your Leader has the {Straw Hat Crew} type, add up to 2 cards from the top of your deck to the top of your Life cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trashLife: 1 }],
      effect: [
        {
          if: { leader: { type: 'Straw Hat Crew' } },
          then: [
            {
              do: {
                move: {
                  what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
                  to: { zone: 'life', position: 'top' },
                },
              },
            },
            {
              do: {
                move: {
                  what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
                  to: { zone: 'life', position: 'top' },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'on-ko',
      label: "Opponent's turn: you may deal 1 damage to your opponent",
      kind: 'auto',
      when: ['onKO'],
      conditions: [{ opponentsTurn: true }],
      effect: [
        {
          may: [{ do: { damage: { player: 'opponent', n: 1 } } }],
          label: 'damage',
          prompt: 'Deal 1 damage to your opponent?',
        },
      ],
    },
  ],
  rulings: [
    'reading: the Life cost is paid before the Leader type is read (the printed colon puts the "If" in the effect), so with another Leader the Life card is lost and nothing is added',
    'engine limit: a deck-top move cannot be { upTo: 2 }, so "up to 2" is two sequential "up to 1" moves (the same set of outcomes: 0, 1 or 2 cards)',
  ],
};
