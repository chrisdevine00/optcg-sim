import type { CardScript } from '../../src/dsl.ts';

/** EB05-061 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_061: CardScript = {
  cardId: 'EB05-061',
  textHash: '03cb86b9a84f3a',
  verified: {
    source: 'cards/overrides/EB05-061.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'life-shield',
      label:
        'If one of your Characters with 6000 base power or less would be removed from the field by your opponent, add 1 card from the top of your Life to your hand instead',
      kind: 'replacement',
      oncePerTurn: true,
      optional: true,
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            basePower: {
              lte: 6000,
            },
          },
        },
        cause: 'opponentEffect',
      },
      instead: [
        {
          lifeToHand: {
            from: 'top',
            n: 1,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: 'Play up to 1 red Character with a cost of 2 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      color: 'Red',
                    },
                    {
                      cost: {
                        lte: 2,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'M6b-Q7 (reading, no ruling): "removed from the field by your opponent" is read as by your opponent\'s effect, as OP15-035; a battle K.O. is not covered',
    'RL-41 / OP12-061: the Life-to-hand replacement is not damage, so no [Trigger]',
  ],
};
