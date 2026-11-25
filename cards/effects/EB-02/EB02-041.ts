import type { CardScript } from '../../src/dsl.ts';

/** EB02-041 Merry Go. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_041: CardScript = {
  cardId: 'EB02-041',
  textHash: '187a46aa907b83',
  verified: {
    source: 'cards/overrides/EB02-041.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader has the {Straw Hat Crew} type, draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Straw Hat Crew',
            },
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'activate',
      label:
        "You may rest this Stage: if your DON!! cards on the field are equal to or fewer than your opponent's, up to 1 of your {Straw Hat Crew} Characters gains +2 cost until the end of your opponent's next turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
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
          then: [
            {
              do: {
                cost: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    filter: {
                      type: 'Straw Hat Crew',
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: 2,
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Read: the DON!! comparison counts every DON!! card on each field (cost area and given, rules-digest), read when the effect resolves, after the Stage is rested; the rest cost is paid either way',
  ],
};
