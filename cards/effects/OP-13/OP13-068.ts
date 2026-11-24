import type { CardScript } from '../../src/dsl.ts';

/** OP13-068 Douglas Bullet. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_068: CardScript = {
  cardId: 'OP13-068',
  textHash: '1c0801ab4a193d',
  verified: {
    source: 'cards/overrides/OP13-068.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'don-bonus',
      label: 'With 8 or more DON!! on your field, this Character gains +2000 power',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              donOnField: 'you',
            },
            '>=',
            8,
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
      label: 'With a {Roger Pirates} Leader: add up to 1 DON!! rested',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              typeIncludes: 'Roger Pirates',
            },
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the DON!! on your field are the cost area (active and rested) plus DON!! given (rules-digest); the bonus follows the count live',
  ],
};
