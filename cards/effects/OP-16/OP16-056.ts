import type { CardScript } from '../../src/dsl.ts';

/** OP16-056 Mr.3(Galdino). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_056: CardScript = {
  cardId: 'OP16-056',
  textHash: '11034148cffcd8',
  verified: {
    source: 'cards/overrides/OP16-056.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "You may trash this Character: draw 2; up to 1 of your opponent's Characters with a cost of 9 or less cannot attack until the end of your opponent's next End Phase",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 9,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              what: 'cannotAttack',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};
