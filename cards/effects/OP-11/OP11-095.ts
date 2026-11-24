import type { CardScript } from '../../src/dsl.ts';

/** OP11-095 Monkey.D.Garp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_095: CardScript = {
  cardId: 'OP11-095',
  textHash: '1c6c1811421516',
  verified: {
    source: 'cards/overrides/OP11-095.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label:
        'You may place 3 "Navy" cards from your trash at the bottom of your deck: give up to 1 rested DON!! to your Leader; then if there is a Character with cost 9 or more, K.O. up to 1 opposing Character with cost 7 or less',
      cost: [
        {
          move: {
            from: 'trash',
            owner: 'you',
            filter: {
              type: 'Navy',
            },
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
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: 'leader',
                owner: 'you',
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'any',
              filter: {
                cost: {
                  gte: 9,
                },
              },
            },
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 7,
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
    'reading: "there is a Character with a cost of 9 or more" counts a Character of either player, by current cost; "Then, if" is checked even when no rested DON!! could be given (no failed "If" guards it)',
  ],
};
