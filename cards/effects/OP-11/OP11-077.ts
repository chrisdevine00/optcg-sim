import type { CardScript } from '../../src/dsl.ts';

/** OP11-077 Randolph. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_077: CardScript = {
  cardId: 'OP11-077',
  textHash: '07597b12fa8f36',
  verified: {
    source: 'cards/overrides/OP11-077.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'don-returned',
      label:
        'When a DON!! card on your field is returned to your DON!! deck, up to 1 of your "Big Mom Pirates" Characters gains +2 cost',
      kind: 'auto',
      when: [
        {
          event: 'donReturned',
          owner: 'you',
        },
      ],
      oncePerTurn: true,
      conditions: [
        {
          yourTurn: true,
        },
      ],
      effect: [
        {
          do: {
            cost: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Big Mom Pirates',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading: any return of your own DON!! counts (a DON!! -X cost or an effect), on your turn only, once per turn; the cost bonus lasts until the end of your opponent's next turn",
  ],
};
