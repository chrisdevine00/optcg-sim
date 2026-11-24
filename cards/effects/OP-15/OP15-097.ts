import type { CardScript } from '../../src/dsl.ts';

/** OP15-097 I Find It Embarrassing as a Human Being. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_097: CardScript = {
  cardId: 'OP15-097',
  textHash: '0bbb9544008614',
  verified: {
    source: 'cards/overrides/OP15-097.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "If you have 10 or more cards in your trash, up to 1 of your opponent's Characters with a base cost of 5 or less cannot attack until the end of your opponent's next End Phase",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: { cmp: [{ trash: 'you' }, '>=', 10] },
          then: [
            {
              do: {
                restrict: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: { baseCost: { lte: 5 } },
                    pick: { upTo: 1 },
                  },
                  what: 'cannotAttack',
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "Activate this card's [Main] effect",
      kind: 'trigger',
      effect: [{ do: { activate: { ability: 'main', of: 'self' } } }],
    },
  ],
};
