import type { CardScript } from '../../src/dsl.ts';

/** OP16-008 Squard. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_008: CardScript = {
  cardId: 'OP16-008',
  textHash: '07bb46d1a56156',
  verified: {
    source: 'cards/overrides/OP16-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may trash 1 of your Characters with 10000 base power: K.O. up to 1 of your opponent's Characters with 8000 power or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'characters',
            owner: 'you',
            filter: {
              basePower: {
                eq: 10000,
              },
            },
            pick: {
              exactly: 1,
            },
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
                power: {
                  lte: 8000,
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
};
