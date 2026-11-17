import type { CardScript } from '../../src/dsl.ts';

/** OP17-089 Jaguar.D.Saul. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_089: CardScript = {
  cardId: 'OP17-089',
  textHash: '0ccdec75d64727',
  verified: {
    source: 'cards/overrides/OP17-089.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'tall',
      label: 'This Character gains +12 cost',
      kind: 'permanent',
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 12,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: 'Look at 3; add up to 1 {Elbaph} card; trash the rest',
      kind: 'auto',
      when: ['onPlay'],
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
                    type: 'Elbaph',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'trash',
            },
          },
        },
      ],
    },
  ],
  rulings: ['QA-OP17 OP17-089 via RL-43: the +12 cost applies only on the field'],
};
