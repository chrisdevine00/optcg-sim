import type { CardScript } from '../../src/dsl.ts';

/** ST30-012 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_012: CardScript = {
  cardId: 'ST30-012',
  textHash: '156ea3dd8b93a5',
  verified: {
    source: 'cards/overrides/ST30-012.json (card text in cards/data)',
    date: '2026-11-16',
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
      label: "Rest up to 1 of your opponent's [Blocker] Characters",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                keyword: 'Blocker',
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
};
