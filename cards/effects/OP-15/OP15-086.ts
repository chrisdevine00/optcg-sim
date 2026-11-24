import type { CardScript } from '../../src/dsl.ts';

/** OP15-086 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_086: CardScript = {
  cardId: 'OP15-086',
  textHash: '0daae12fa546a2',
  verified: {
    source: 'cards/overrides/OP15-086.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the {Straw Hat Crew} type, play up to 1 {Straw Hat Crew} Character with a cost of 7 or less from your trash; it gains [Rush] this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { type: 'Straw Hat Crew' } },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { type: 'Straw Hat Crew' },
                        { cost: { lte: 7 } },
                      ],
                    },
                    pick: { upTo: 1 },
                    bind: 'played',
                  },
                },
              },
            },
            {
              do: {
                grant: {
                  target: { from: 'characters', owner: 'you', filter: { ref: 'played' } },
                  keyword: 'Rush',
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
