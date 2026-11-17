import type { CardScript } from '../../src/dsl.ts';

/** OP17-084 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_084: CardScript = {
  cardId: 'OP17-084',
  textHash: '0116d51590f541',
  verified: {
    source: 'cards/overrides/OP17-084.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If there is a Character with a cost of 12 or more, up to 1 of your Characters gains [Unblockable]',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'any',
              filter: {
                cost: {
                  gte: 12,
                },
              },
            },
          },
          then: [
            {
              do: {
                grant: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
                  },
                  keyword: 'Unblockable',
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
