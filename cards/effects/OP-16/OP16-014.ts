import type { CardScript } from '../../src/dsl.ts';

/** OP16-014 Marco. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_014: CardScript = {
  cardId: 'OP16-014',
  textHash: '0096c3d832b37c',
  verified: {
    source: 'cards/overrides/OP16-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko-shield',
      label:
        "If one of your Characters would be removed from the field by your opponent's effect, you may K.O. this Character instead",
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'you',
              filter: {
                isSelf: true,
              },
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        'You may trash 1 Character card with 8000 power from your hand: play this Character card from your trash',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              all: [
                {
                  category: ['Character'],
                },
                {
                  power: {
                    eq: 8000,
                  },
                },
              ],
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
            play: {
              what: {
                from: 'self',
                owner: 'you',
              },
            },
          },
        },
      ],
    },
  ],
};
