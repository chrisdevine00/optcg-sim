import type { CardScript } from '../../src/dsl.ts';

/** OP15-093 The Risky Brothers. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_093: CardScript = {
  cardId: 'OP15-093',
  textHash: '1447e930899e19',
  verified: {
    source: 'cards/overrides/OP15-093.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'grant',
      label:
        'You may trash this Character: if you have 15 or more cards in your trash, up to 1 of your [Monkey.D.Luffy] Characters gains [Rush: Character] and the "Slash" attribute during this turn',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                trash: 'you',
              },
              '>=',
              15,
            ],
          },
          then: [
            {
              do: {
                grant: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    filter: {
                      name: 'Monkey.D.Luffy',
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  keyword: 'Rush: Character',
                  attribute: 'Slash',
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
    'reading (G59, M6b-Q76): the "If" follows the cost colon, so it is an effect condition and the trash is counted after this Character is in it (it counts itself); the keyword and the attribute go to the same one card (one grant); the attribute is added to the printed ones',
  ],
};
