import type { CardScript } from '../../src/dsl.ts';

/** OP18-050 Mr.3 & Miss.Goldenweek. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_050: CardScript = {
  cardId: 'OP18-050',
  textHash: '0378c8053cb556',
  verified: {
    source: 'cards/overrides/OP18-050.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader's type includes \"Baroque Works\", up to 1 of your opponent's Characters with a cost of 7 or less cannot attack until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { typeIncludes: 'Baroque Works' } },
          then: [
            {
              do: {
                restrict: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: { cost: { lte: 7 } },
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
  ],
};
