import type { CardScript } from '../../src/dsl.ts';

/** EB05-046 Yamato. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_046: CardScript = {
  cardId: 'EB05-046',
  textHash: '13f6784fd06ec9',
  verified: {
    source: 'cards/overrides/EB05-046.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'big-guard',
      label:
        'If your opponent has a Character with 8000 base power or more: gains [Blocker] and +3000 power',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'opponent',
            filter: {
              basePower: {
                gte: 8000,
              },
            },
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
            keyword: 'Blocker',
          },
        },
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 3000,
          },
        },
      ],
    },
    {
      id: 'opp-attack',
      label:
        "Trash 1 card from your hand: if you have 10 or more cards in your trash, your Leader's base power becomes 7000 this turn",
      kind: 'auto',
      when: ['onOpponentAttack'],
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
                trash: 'you',
              },
              '>=',
              10,
            ],
          },
          then: [
            {
              do: {
                setBasePower: {
                  target: {
                    from: 'leader',
                    owner: 'you',
                  },
                  value: 7000,
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
    'Reading: the trash count is checked after the hand card is trashed as the cost (the cost is paid before the colon)',
  ],
};
