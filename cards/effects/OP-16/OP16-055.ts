import type { CardScript } from '../../src/dsl.ts';

/** OP16-055 Mr.2.Bon.Kurei(Bentham). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_055: CardScript = {
  cardId: 'OP16-055',
  textHash: '0496d441e31e61',
  verified: {
    source: 'cards/overrides/OP16-055.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 1',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
    {
      id: 'copy-leader',
      label:
        "This Character's base power becomes the same as your opponent's Leader during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 1,
        },
      ],
      effect: [
        {
          do: {
            select: {
              from: 'leader',
              owner: 'opponent',
              bind: 'oppLeader',
            },
          },
        },
        {
          do: {
            setBasePower: {
              target: {
                from: 'self',
                owner: 'you',
              },
              value: {
                refStat: 'oppLeader',
                stat: 'power',
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
