import type { CardScript } from '../../src/dsl.ts';

/** OP15-085 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_085: CardScript = {
  cardId: 'OP15-085',
  textHash: '0660819d7ead2a',
  verified: {
    source: 'cards/overrides/OP15-085.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 3 cards from the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ do: { mill: { player: 'you', n: 3 } } }],
    },
    {
      id: 'recover',
      label:
        'You may trash this Character: if your Leader has the {Straw Hat Crew} type, add up to 1 {Straw Hat Crew} Character card other than [Tony Tony.Chopper] from your trash to your hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ trashSelf: true }],
      effect: [
        {
          if: { leader: { type: 'Straw Hat Crew' } },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { type: 'Straw Hat Crew' },
                        { not: { name: 'Tony Tony.Chopper' } },
                      ],
                    },
                    pick: { upTo: 1 },
                  },
                  to: { zone: 'hand' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
