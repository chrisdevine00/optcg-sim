import type { CardScript } from '../../src/dsl.ts';

/** PRB02-005 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_005: CardScript = {
  cardId: 'PRB02-005',
  textHash: '053f352f87d8e5',
  verified: {
    source: 'card text in cards/data (Limitless cross-check 2026-11-24); official PRB02 Q&A',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Your Turn, On Play: if your Leader is multicolored and your opponent has 7 or less DON!!, they rest 1 of their active DON!! at the start of their next Main Phase',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [{ yourTurn: true }],
      effect: [
        {
          if: {
            all: [{ leader: { multicolor: true } }, { cmp: [{ donOnField: 'opponent' }, '<=', 7] }],
          },
          then: [
            {
              delayed: { at: 'startOfOpponentsNextMainPhase' },
              do: [
                {
                  do: {
                    rest: {
                      from: 'donCostArea',
                      owner: 'opponent',
                      chooser: 'opponent',
                      pick: { exactly: 1 },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Reading (M6b-Q91, official PRB02 Q&A for PRB02-005): the conditions are read when the [On Play] resolves; the opponent still rests 1 active DON!! if they have 8 or more at the start of their next Main Phase. With no active DON!! then, nothing happens',
    'The rest happens after the Main Phase\'s own "start of Main Phase" effects; the opponent chooses which active DON!! (all are alike, so the prompt has one answer). The delayed effect does not depend on this Character staying on the field (M4a-10)',
    'The "If" with no colon is an effect condition (DECISIONS 2026-11-24 B3A-R1); [Your Turn] is an ability condition',
  ],
};
