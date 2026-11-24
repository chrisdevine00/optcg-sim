import type { CardScript } from '../../src/dsl.ts';

/** ST30-007 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_007: CardScript = {
  cardId: 'ST30-007',
  textHash: '180efe4f1abe44',
  verified: {
    source: 'cards/overrides/ST30-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may rest 1 DON!!: this Character gains [Rush] during this turn',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          restDon: 1,
        },
      ],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'self',
                owner: 'you',
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label: "Give up to 1 of your opponent's Characters -1000 power during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
