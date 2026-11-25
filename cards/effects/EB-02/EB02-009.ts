import type { CardScript } from '../../src/dsl.ts';

/** EB02-009 Thousand Sunny. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_009: CardScript = {
  cardId: 'EB02-009',
  textHash: '0c446851ec1dea',
  verified: {
    source: 'cards/overrides/EB02-009.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'You may rest this Stage: give up to 1 of your currently given DON!! cards to 1 of your "Straw Hat Crew" type Characters',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            moveDon: {
              n: 1,
              from: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Straw Hat Crew',
                },
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
    'reading (G65, M6b-Q82): "up to 1 of your currently given DON!! cards" takes one DON!! from a Leader or Character of yours that has some ("up to 1": the source may be declined) and gives it to a different {Straw Hat Crew} Character; no DON!! changes state',
    'reading: "You may rest this Stage" on an [Activate: Main] is a plain `restSelf` cost with no `costOptional` (optional-cost check): activating is the choice, so the Stage is rested whatever the effect then finds to move',
  ],
};
