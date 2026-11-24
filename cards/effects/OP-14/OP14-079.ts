import type { CardScript } from '../../src/dsl.ts';

/** OP14-079 Crocodile. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_079: CardScript = {
  cardId: 'OP14-079',
  textHash: '1798b039c1738e',
  verified: {
    source: 'cards/overrides/OP14-079.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'no-removal',
      label: "All of your opponent's Characters cannot be removed from the field by your effects",
      kind: 'permanent',
      apply: [
        {
          restrict: {
            target: {
              from: 'characters',
              owner: 'opponent',
            },
            what: 'cannotBeRemovedByOpponentEffects',
          },
        },
      ],
    },
    {
      id: 'activate',
      label:
        'You may K.O. 1 of your Baroque Works Characters: give up to 1 opposing Character -10 cost during this turn; you may trash 2 cards from the top of your deck',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          ko: {
            from: 'characters',
            owner: 'you',
            filter: {
              typeIncludes: 'Baroque Works',
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
            cost: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -10,
              duration: 'thisTurn',
            },
          },
        },
        {
          may: [
            {
              do: {
                mill: {
                  player: 'you',
                  n: 2,
                },
              },
            },
          ],
          label: 'mill',
        },
      ],
    },
  ],
  rulings: [
    "reading (M6b-Q-G1 family): the restriction is a restriction on the opponent's Characters against the controller's effects (the engine's cannotBeRemovedByOpponentEffects seen from the Character); battle K.O.s, their own effects and rules are unaffected",
    'reading: the K.O. cost is a real K.O. of your own Character (its [On K.O.] fires); the mill is a separate "you may" effect step, not a cost',
  ],
};
