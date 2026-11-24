import type { CardScript } from '../../src/dsl.ts';

/** ST32-004 Silvers Rayleigh. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST32_004: CardScript = {
  cardId: 'ST32-004',
  textHash: '1dd2b12db66ea1',
  verified: {
    source: 'cards/overrides/ST32-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush-char',
      label: 'If your Leader has the <Slash> attribute, this Character gains [Rush: Character]',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            attribute: 'Slash',
          },
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Rush: Character',
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: "Rest up to 2 of your opponent's Characters with a cost of 2 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
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
                upTo: 2,
              },
            },
          },
        },
      ],
    },
  ],
};
