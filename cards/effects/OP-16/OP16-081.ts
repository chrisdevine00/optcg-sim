import type { CardScript } from '../../src/dsl.ts';

/** OP16-081 Otama. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_081: CardScript = {
  cardId: 'OP16-081',
  textHash: '10a02cc5aaf791',
  verified: {
    source: 'cards/overrides/OP16-081.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shrink',
      label:
        "Rest this Character: with a Character of cost 8 or more, give up to 1 of your opponent's Characters -2000 power during this turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: {
                cost: {
                  gte: 8,
                },
              },
            },
          },
          then: [
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
                  amount: -2000,
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
