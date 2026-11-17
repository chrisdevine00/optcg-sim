import type { CardScript } from '../../src/dsl.ts';

/** ST31-005 Thousand Sunny. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST31_005: CardScript = {
  cardId: 'ST31-005',
  textHash: '0f9857b7e9c275',
  verified: {
    source: 'cards/overrides/ST31-005.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 5; add up to 1 {Straw Hat Crew} card to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Straw Hat Crew',
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
    {
      id: 'give-don',
      label:
        'You may rest this Stage: give up to 1 rested DON!! card to 1 of your [Monkey.D.Luffy] cards',
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
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Monkey.D.Luffy',
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
    'Read: "[Monkey.D.Luffy] cards" covers a Leader or Character of that name (CR 2-1-2); DON!! cannot be given to a Stage or a card in hand (RL-35)',
  ],
};
