import type { CardScript } from '../../src/dsl.ts';

/** ST30-001 Luffy & Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_001: CardScript = {
  cardId: 'ST30-001',
  textHash: '0bd7512b65015c',
  verified: {
    source: 'cards/overrides/ST30-001.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'self-minus',
      label: 'With a Character of 7000 base power or more, this Leader gets -2000 power',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              basePower: {
                gte: 7000,
              },
            },
          },
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: -2000,
          },
        },
      ],
    },
    {
      id: 'opp-turn-boost',
      label: "[Opponent's Turn] your [Portgas.D.Ace] and [Monkey.D.Luffy] cards gain +3000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: ['leader', 'characters'],
              owner: 'you',
              filter: {
                any: [
                  {
                    name: 'Portgas.D.Ace',
                  },
                  {
                    name: 'Monkey.D.Luffy',
                  },
                ],
              },
            },
            amount: 3000,
          },
        },
      ],
    },
  ],
  rulings: [
    'RL-49 / QA-ST30 ST30-001 row 1: with no Character of 7000 base power or more there is no -2000',
    'RL-49 / QA-ST30 ST30-001 row 2: the Leader is named "Luffy & Ace", so the [Opponent\'s Turn] effect never applies to it (CR 2-1-2)',
    'CR 4-9-2: "base power" ignores modifiers; the -2000 is re-checked whenever the board changes (layered permanent, DECISIONS 2026-11-16)',
  ],
};
