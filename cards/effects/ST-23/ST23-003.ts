import type { CardScript } from '../../src/dsl.ts';

/** ST23-003 Benn.Beckman. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST23_003: CardScript = {
  cardId: 'ST23-003',
  textHash: '041ecae3f937f5',
  verified: {
    source: 'cards/overrides/ST23-003.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 1 card from your hand: if your Leader has the "Red-Haired Pirates" type, K.O. up to 1 of your opponent\'s Characters with 4000 base power or less',
      kind: 'auto',
      when: ['onPlay'],
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
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Red-Haired Pirates',
            },
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    basePower: {
                      lte: 4000,
                    },
                  },
                  pick: {
                    upTo: 1,
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
    'reading: the "If" follows the cost colon, an effect condition: the card is trashed even when the Leader is not {Red-Haired Pirates} and nothing is K.O.\'d',
  ],
};
