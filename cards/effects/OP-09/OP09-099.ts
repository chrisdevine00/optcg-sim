import type { CardScript } from '../../src/dsl.ts';

/** OP09-099 Fullalead. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_099: CardScript = {
  cardId: 'OP09-099',
  textHash: '153568055b7186',
  verified: {
    source: 'cards/overrides/OP09-099.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Trash 1 card from your hand and rest this Stage: look at 3; reveal up to 1 Blackbeard Pirates card and add it to your hand; rest to the bottom',
      kind: 'activate',
      when: 'activateMain',
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
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Blackbeard Pirates',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
};
