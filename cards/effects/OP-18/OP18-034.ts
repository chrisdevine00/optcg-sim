import type { CardScript } from '../../src/dsl.ts';

/** OP18-034 Franky. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_034: CardScript = {
  cardId: 'OP18-034',
  textHash: '16e1e0926bc27b',
  verified: {
    source: 'cards/overrides/OP18-034.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Play up to 1 {The Franky Family} or {Straw Hat Crew} card with a cost of 5 or less from your hand; then, with a Stage of cost 5 or more, rest up to 1 opponent's Character with a cost of 6 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    { any: [{ type: 'The Franky Family' }, { type: 'Straw Hat Crew' }] },
                    { cost: { lte: 5 } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
        {
          if: { exists: { from: 'stage', owner: 'you', filter: { cost: { gte: 5 } } } },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { cost: { lte: 6 } },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "card" plays a Character or a Stage (Events are never played, CR 2-7-3); the Stage check reads the field after the play, so a Stage just played counts',
  ],
};
