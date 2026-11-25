import type { CardScript } from '../../src/dsl.ts';

/** OP12-036 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_036: CardScript = {
  cardId: 'OP12-036',
  textHash: '0d8c3233ae17cc',
  verified: {
    source: 'cards/overrides/OP12-036.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'no-effect-play',
      label: 'This card in your hand cannot be played by effects',
      kind: 'permanent',
      zone: 'hand',
      apply: [
        {
          restrict: {
            target: {
              from: 'self',
              owner: 'you',
            },
            what: 'cannotBePlayedByEffects',
          },
        },
      ],
    },
    {
      id: 'slash-guard',
      label:
        "If your Leader has the <Slash> attribute, this Character cannot be K.O.'d in battle by <Slash> attribute cards and gains +1000 power",
      kind: 'permanent',
      conditions: [
        {
          leader: {
            attribute: 'Slash',
          },
        },
      ],
      apply: [
        {
          restrict: {
            target: {
              from: 'self',
              owner: 'you',
            },
            what: {
              cannotBeKOd: {
                cause: 'battle',
                by: {
                  attribute: 'Slash',
                },
              },
            },
          },
        },
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 1000,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (G63, M6b-Q80): "cannot be played by effects" holds while the card is in the hand, for an effect of either player; playing it by the rules stays legal',
    'reading (G46, M6b-Q68): "in battle by <Slash> attribute cards" reads the attacking card\'s attribute, Leader or Character; effects and other attributes still K.O. it. The Leader\'s <Slash> attribute is read live (a granted attribute counts), and both the protection and the +1000 power need it',
  ],
};
