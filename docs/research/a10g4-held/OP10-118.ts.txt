import type { CardScript } from '../../src/dsl.ts';

/** OP10-118 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_118: CardScript = {
  cardId: 'OP10-118',
  textHash: '18ebcbd3c8f3fe',
  verified: {
    source: 'cards/overrides/OP10-118.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'protect',
      label: "Once per turn, this Character cannot be K.O.'d by your opponent's effects",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
        cause: 'opponentEffect',
      },
      optional: false,
      instead: [],
    },
    {
      id: 'when-attacking',
      label:
        'You may place 3 cards from your trash at the bottom of your deck in any order: if your opponent has 5 or more cards in their hand, they trash 1 card from their hand',
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [
        {
          move: {
            from: 'trash',
            owner: 'you',
            pick: {
              exactly: 3,
            },
          },
          to: {
            zone: 'deck',
            position: 'bottom',
          },
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'opponent',
              },
              '>=',
              5,
            ],
          },
          then: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'opponent',
                  chooser: 'opponent',
                  pick: {
                    exactly: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    "M6b-Q36 reading: the once-per-turn protection is a mandatory Once Per Turn K.O. replacement with an empty payload: the first K.O. by an opponent's effect each turn is prevented and spends it; a second one that turn happens",
    'reading: the hand-size check is after the colon (effect-level if): the 3 trash cards are placed even when the opponent has 4 or fewer cards; the opponent chooses the card to trash',
  ],
};
