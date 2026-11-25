import type { CardScript } from '../../src/dsl.ts';

/** ST22-011 Whitey Bay. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST22_011: CardScript = {
  cardId: 'ST22-011',
  textHash: '05f27720ac9fd4',
  verified: {
    source: 'cards/overrides/ST22-011.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Your turn: you may reveal 2 {Whitebeard Pirates} cards from your hand: your {Whitebeard Pirates} Leader gains +2000 power during this turn',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              typeIncludes: 'Whitebeard Pirates',
            },
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
                filter: {
                  typeIncludes: 'Whitebeard Pirates',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'text: the cost clause "You may reveal 2 cards with a type including \\"Whitebeard Pirates\\" from your hand:" is missing upstream (optcgapi) and was verified from Limitless (DECISIONS 2026-11-24, Open decisions)',
    "reading: [Your Turn] [On Play] is an On Play that can only trigger on your own turn (a play by an effect on the opponent's turn does not fire it)",
  ],
};
