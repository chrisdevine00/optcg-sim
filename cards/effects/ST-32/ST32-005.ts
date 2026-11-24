import type { CardScript } from '../../src/dsl.ts';

/** ST32-005 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST32_005: CardScript = {
  cardId: 'ST32-005',
  textHash: '053653f0155aa4',
  verified: {
    source: 'cards/overrides/ST32-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush: Character'],
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader has the <Slash> attribute, rest up to 1 of your opponent's Characters with a cost of 2 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              attribute: 'Slash',
            },
          },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 2,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
