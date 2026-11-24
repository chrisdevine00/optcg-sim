import type { CardScript } from '../../src/dsl.ts';

/** OP14-072 Baby 5. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_072: CardScript = {
  cardId: 'OP14-072',
  textHash: '1efad2a509acb5',
  verified: {
    source: 'cards/overrides/OP14-072.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Add up to 1 DON!! and set it as active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'DON!! -1: add up to 1 card from the top of your deck to the top of your Life cards',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'deckTop',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
              },
            },
          },
        },
      ],
    },
  ],
};
