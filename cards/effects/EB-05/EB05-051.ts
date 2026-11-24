import type { CardScript } from '../../src/dsl.ts';

/** EB05-051 Ahiru. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_051: CardScript = {
  cardId: 'EB05-051',
  textHash: '1fbff3bb22a334',
  verified: {
    source: 'cards/overrides/EB05-051.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Rest up to 1 of your opponent's Characters with a cost equal to or less than the total of both players' Life cards",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: {
                    life: 'both',
                  },
                },
              },
              pick: {
                upTo: 1,
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
  rulings: [
    "Reading: the Life total is counted when the effect resolves; both players' Life cards are counted",
  ],
};
