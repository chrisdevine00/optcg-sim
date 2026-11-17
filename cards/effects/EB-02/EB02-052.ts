import type { CardScript } from '../../src/dsl.ts';

/** EB02-052 Enel. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_052: CardScript = {
  cardId: 'EB02-052',
  textHash: '13686f24f1a2ee',
  verified: {
    source: 'cards/overrides/EB02-052.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'rush',
      label: 'With a "Sky Island" Leader, this Character gains [Rush]',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            typeIncludes: 'Sky Island',
          },
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
      id: 'when-attacking',
      label:
        'Trash 1 card: with 1 or less Life add 1 deck card to your Life; this gains +1000 power',
      kind: 'auto',
      when: ['whenAttacking'],
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
            cmp: [
              {
                life: 'you',
              },
              '<=',
              1,
            ],
          },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'deckTop',
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
                  },
                  to: {
                    zone: 'life',
                    position: 'top',
                  },
                },
              },
            },
            {
              do: {
                power: {
                  target: {
                    from: 'self',
                    owner: 'you',
                  },
                  amount: 1000,
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
    'CR 4-10-1: "Then, this Character gains +1000 power" follows the "If you have 1 or less Life cards" clause, so it is inside the condition (reading recorded in docs/research/m4b-wave2/robin-yenel.md)',
  ],
};
