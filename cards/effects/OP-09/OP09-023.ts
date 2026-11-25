import type { CardScript } from '../../src/dsl.ts';

/** OP09-023 Adio. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_023: CardScript = {
  cardId: 'OP09-023',
  textHash: '05d08980033551',
  verified: {
    source: 'cards/overrides/OP09-023.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader has the {ODYSSEY} type, set up to 3 of your DON!! cards as active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'ODYSSEY',
            },
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'donCostArea',
                  owner: 'you',
                  pick: {
                    upTo: 3,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'opp-attack',
      label:
        'Once per turn, rest 1 DON!!: up to 1 of your Leader or Character cards gains +2000 power during this battle',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [
        {
          restDon: 1,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
