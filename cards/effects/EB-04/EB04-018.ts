import type { CardScript } from '../../src/dsl.ts';

/** EB04-018 Megalo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_018: CardScript = {
  cardId: 'EB04-018',
  textHash: '1e38fee7a1823b',
  verified: {
    source: 'cards/overrides/EB04-018.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may rest this Character: K.O. up to 1 of your opponent's rested Characters with 8000 power or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    state: 'rested',
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
      ],
    },
  ],
  rulings: [
    'reading: "8000 power or less" is the current power (given DON!! count only on their owner\'s turn); the cost needs this Character active; the opponent\'s Leader is not a Character',
  ],
};
