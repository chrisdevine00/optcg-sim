import type { CardScript } from '../../src/dsl.ts';

/** ST34-001 Charlotte Katakuri. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST34_001: CardScript = {
  cardId: 'ST34-001',
  textHash: '1c15e68f2ebe50',
  verified: {
    source: 'cards/overrides/ST34-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'don-back',
      label:
        'Your Turn, Once Per Turn: when a DON!! card on your field is returned to your DON!! deck, if your Leader has the {Big Mom Pirates} type, add up to 2 DON!! cards from your DON!! deck and rest them',
      kind: 'auto',
      when: [
        {
          event: 'donReturned',
          owner: 'you',
        },
      ],
      conditions: [
        {
          yourTurn: true,
        },
        {
          leader: {
            type: 'Big Mom Pirates',
          },
        },
      ],
      oncePerTurn: true,
      effect: [
        {
          do: {
            addDon: [
              {
                n: 2,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Play up to 1 Character card with 8000 power or less from your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      power: {
                        lte: 8000,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "[Once Per Turn]" is spent only when the Leader condition holds (an intervening if); [Your Turn] and the Leader type are checked when a DON!! is returned',
  ],
};
