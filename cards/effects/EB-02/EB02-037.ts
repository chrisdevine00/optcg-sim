import type { CardScript } from '../../src/dsl.ts';

/** EB02-037 Franky. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_037: CardScript = {
  cardId: 'EB02-037',
  textHash: '0acbdf9ff51f50',
  verified: {
    source: 'cards/overrides/EB02-037.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'add-don',
      label:
        'If your Leader has {Straw Hat Crew} and you have as few DON!! as your opponent or fewer: add up to 1 DON!! and rest it',
      kind: 'auto',
      when: ['onPlay', 'whenAttacking'],
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  type: 'Straw Hat Crew',
                },
              },
              {
                cmp: [
                  {
                    donOnField: 'you',
                  },
                  '<=',
                  {
                    donOnField: 'opponent',
                  },
                ],
              },
            ],
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
    'reading: DON!! on a field is cost area plus given DON!!; "equal to or less than" is inclusive; checked when the effect resolves, once per timing',
  ],
};
