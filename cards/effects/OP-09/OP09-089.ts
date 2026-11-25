import type { CardScript } from '../../src/dsl.ts';

/** OP09-089 Stronger. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_089: CardScript = {
  cardId: 'OP09-089',
  textHash: '0d3b07b80c9c36',
  verified: {
    source: 'cards/overrides/OP09-089.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      kind: 'activate',
      when: 'activateMain',
      label:
        "Trash 1 card from your hand and trash this Character: with a {Blackbeard Pirates} Leader, draw 1 card, then give up to 1 of your opponent's Characters -2 cost during this turn",
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
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Blackbeard Pirates',
            },
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
            {
              do: {
                cost: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -2,
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
    'reading (M4b-5): "Then, give ... -2 cost" follows the Leader "If" sentence, so it is inside the guard; the cost (1 card and this Character) is paid either way',
  ],
};
