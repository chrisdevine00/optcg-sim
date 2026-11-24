import type { CardScript } from '../../src/dsl.ts';

/** OP11-042 Vito. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_042: CardScript = {
  cardId: 'OP11-042',
  textHash: '05779699d9471c',
  verified: {
    source: 'cards/overrides/OP11-042.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may trash 1 {Firetank Pirates} card from your hand: this Character gains [Rush]',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              type: 'Firetank Pirates',
            },
            pick: {
              exactly: 1,
            },
          },
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
  ],
};
