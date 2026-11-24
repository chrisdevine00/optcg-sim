import type { CardScript } from '../../src/dsl.ts';

/** OP16-048 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_048: CardScript = {
  cardId: 'OP16-048',
  textHash: '17f30c0337733e',
  verified: {
    source: 'cards/overrides/OP16-048.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the {Impel Down} type, draw 1 and play up to 1 [Prisoner of Impel Down] from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Impel Down',
            },
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      name: 'Prisoner of Impel Down',
                    },
                    pick: {
                      upTo: 1,
                    },
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
      label: 'Up to 1 of your [Prisoner of Impel Down] cards gains [Blocker] during this turn',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  name: 'Prisoner of Impel Down',
                },
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Blocker',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
