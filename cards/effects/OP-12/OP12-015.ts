import type { CardScript } from '../../src/dsl.ts';

/** OP12-015 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_015: CardScript = {
  cardId: 'OP12-015',
  textHash: '1a97a833780478',
  verified: {
    source: 'cards/overrides/OP12-015.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'don-boost',
      label: 'With 2 or more given DON!! cards, this Character gains +2000 power',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              donGiven: 'you',
            },
            '>=',
            2,
          ],
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 2000,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'Reveal 2 Events: play a red Character of 3000 power or less; then give 1 rested DON!!',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              category: ['Event'],
            },
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
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      color: 'Red',
                    },
                    {
                      category: ['Character'],
                    },
                    {
                      power: {
                        lte: 3000,
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
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
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
    'Read: "given DON!! cards" counts the DON!! given to every Leader and Character you control (donGiven)',
    'Read: "Then, give ..." is not conditioned on the play (it is not "If you do"), so the DON!! is given even when nothing was played',
  ],
};
