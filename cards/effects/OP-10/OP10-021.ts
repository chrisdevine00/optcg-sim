import type { CardScript } from '../../src/dsl.ts';

/** OP10-021 Punk Hazard. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_021: CardScript = {
  cardId: 'OP10-021',
  textHash: '14f1cf604cb4c1',
  verified: {
    source: 'cards/overrides/OP10-021.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give-don',
      label:
        'You may rest this Stage: if your Leader is [Caesar Clown], give up to 1 rested DON!! card to your Leader or 1 of your Characters',
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
            leader: {
              name: 'Caesar Clown',
            },
          },
          then: [
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
    },
  ],
  rulings: [
    'reading: the Leader check is after the colon, so the Stage is rested (cost) even when the Leader is not [Caesar Clown]; the DON!! is a rested cost-area DON!! (as OP11-016)',
  ],
};
