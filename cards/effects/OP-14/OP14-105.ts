import type { CardScript } from '../../src/dsl.ts';

/** OP14-105 Gorgon Sisters. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_105: CardScript = {
  cardId: 'OP14-105',
  textHash: '1230e1527bd083',
  verified: {
    source: 'cards/overrides/OP14-105.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'give',
      label:
        'Reveal 3 {Amazon Lily} or {Kuja Pirates} cards from your hand: give your Leader and each Character up to 1 rested DON!!',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              any: [
                {
                  type: 'Amazon Lily',
                },
                {
                  type: 'Kuja Pirates',
                },
              ],
            },
            pick: {
              exactly: 3,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              each: true,
              upTo: true,
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'If your Leader has the {Kuja Pirates} type, play this card',
      kind: 'trigger',
      effect: [
        {
          if: {
            leader: {
              type: 'Kuja Pirates',
            },
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'self',
                    owner: 'you',
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
    'Activate: Main with "You may <cost>:" is not a costOptional ability: using the activation is the choice (DECISIONS 2026-11-09, B-1)',
    'giveDon with each: every target gets up to 1 rested DON!!; with fewer DON!! than targets the player chooses which (DECISIONS 2026-11-16)',
  ],
};
