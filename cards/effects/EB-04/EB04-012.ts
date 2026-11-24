import type { CardScript } from '../../src/dsl.ts';

/** EB04-012 Kikunojo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_012: CardScript = {
  cardId: 'EB04-012',
  textHash: '11e6beb06dcf29',
  verified: {
    source: 'cards/overrides/EB04-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label: 'If this Character was played this turn, set your {Land of Wano} Leader as active',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: {
            self: {
              playedThisTurn: true,
            },
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'leader',
                  owner: 'you',
                  filter: {
                    type: 'Land of Wano',
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" is not before a colon, so it is an effect condition: on a later turn the ability can be activated (and burns Once Per Turn) but does nothing; "played" means entered the field this turn, by any play',
  ],
};
