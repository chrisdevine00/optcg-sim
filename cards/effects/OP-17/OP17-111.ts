import type { CardScript } from '../../src/dsl.ts';

/** OP17-111 Charlotte Mont-d'or. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_111: CardScript = {
  cardId: 'OP17-111',
  textHash: '109bd7ed51eedf',
  verified: {
    source: 'cards/overrides/OP17-111.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Reveal 2 cards with a [Trigger]: K.O. up to 2 opponent Characters with a cost of 1 or less',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              hasTrigger: true,
            },
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 1,
                },
              },
              pick: {
                upTo: 2,
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Play this card',
      kind: 'trigger',
      effect: [
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
};
