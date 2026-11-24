import type { CardScript } from '../../src/dsl.ts';

/** OP16-015 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_015: CardScript = {
  cardId: 'OP16-015',
  textHash: '0964c13a346b9e',
  verified: {
    source: 'cards/overrides/OP16-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cheaper',
      label: 'In hand: -2 cost if your Leader name includes "Ace" and you have 6 or more DON!!',
      kind: 'permanent',
      zone: 'hand',
      conditions: [
        {
          leader: {
            nameIncludes: 'Ace',
          },
        },
        {
          cmp: [
            {
              donOnField: 'you',
            },
            '>=',
            6,
          ],
        },
      ],
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: -2,
          },
        },
      ],
    },
    {
      id: 'opp-attack',
      label:
        "You may trash 1 Character card with 8000 power from your hand: your Leader and this Character's base power becomes 7000 this turn",
      kind: 'auto',
      when: ['onOpponentAttack'],
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
        {
          do: {
            setBasePower: {
              target: {
                from: 'self',
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
};
