import type { CardScript } from '../../src/dsl.ts';

/** OP11-110 Fukaboshi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_110: CardScript = {
  cardId: 'OP11-110',
  textHash: '1b36fbc7afa3a8',
  verified: {
    source: 'cards/overrides/OP11-110.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko-shield',
      label:
        "If this Character would be K.O.'d, you may rest 1 of your [Fish-Man Island] or your [Shirahoshi] Leader instead",
      kind: 'replacement',
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
      },
      optional: true,
      instead: [
        {
          rest: {
            from: ['stage', 'leader'],
            owner: 'you',
            filter: {
              any: [
                {
                  name: 'Fish-Man Island',
                },
                {
                  name: 'Shirahoshi',
                },
              ],
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
    },
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label:
        "You may add 1 card from the top or bottom of your Life cards to your hand: K.O. up to 1 of your opponent's Characters with a cost of 1 or less",
      cost: [
        {
          lifeToHand: {
            from: 'topOrBottom',
            n: 1,
          },
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 1,
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
  rulings: [
    'reading: only an active [Fish-Man Island] Stage or active [Shirahoshi] Leader can be rested for the replacement; the Leader is named [Shirahoshi] (not "has"), and the replacement covers every K.O. cause',
  ],
};
