import type { CardScript } from '../../src/dsl.ts';

/** ST31-004 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST31_004: CardScript = {
  cardId: 'ST31-004',
  textHash: '11744ad0c48b9d',
  verified: {
    source: 'cards/overrides/ST31-004.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'rush',
      label: 'With 3 or more given DON!! in total, gains [Rush]',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              donGiven: 'you',
            },
            '>=',
            3,
          ],
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Rush',
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'For every {Straw Hat Crew} card on your field, give up to 1 opposing Character -1000 power',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          forEach: {
            count: {
              from: 'field',
              owner: 'you',
              filter: {
                type: 'Straw Hat Crew',
              },
            },
          },
          do: [
            {
              do: {
                power: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -1000,
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
    'cards/data text confirmed as "-1000 power" (data-sources.md fix 56); the count is taken once at the start and includes this card, the Leader and the Stage; each repetition may pick the same or another Character',
  ],
};
