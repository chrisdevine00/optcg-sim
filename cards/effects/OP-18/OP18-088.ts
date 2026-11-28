import type { CardScript } from '../../src/dsl.ts';

/** OP18-088 Saint Sommers. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_088: CardScript = {
  cardId: 'OP18-088',
  textHash: '11c4ba617b3860',
  verified: {
    source: 'cards/overrides/OP18-088.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If you have 6 or more DON!! cards on your field, K.O. up to 1 of your opponent's Characters with a base cost of 4 or less",
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '>=',
              6,
            ],
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    baseCost: {
                      lte: 4,
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
    {
      id: 'on-ko',
      label: 'You may trash 2 cards from your hand: play this Character card from your trash',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  isSelf: true,
                },
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (B3A-R1): the colon-less "If you have 6 or more DON!! cards" is an effect condition; DON!! on your field counts the cost area and DON!! given to cards, active or rested',
  ],
};
