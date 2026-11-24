import type { CardScript } from '../../src/dsl.ts';

/** OP16-068 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_068: CardScript = {
  cardId: 'OP16-068',
  textHash: '17faf6fad68d45',
  verified: {
    source: 'cards/overrides/OP16-068.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Add up to 1 active DON!!',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
    {
      id: 'attack',
      label: 'With a {Donquixote Pirates} Leader this Character gains +3000 power during this turn',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          if: {
            leader: {
              type: 'Donquixote Pirates',
            },
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'self',
                    owner: 'you',
                  },
                  amount: 3000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
