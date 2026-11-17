import type { CardScript } from '../../src/dsl.ts';

/** EB01-059 Kingdom Come. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB01_059: CardScript = {
  cardId: 'EB01-059',
  textHash: '13196c8ca71577',
  verified: {
    source: 'cards/overrides/EB01-059.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label: 'K.O. up to 1 opponent Character; then trash Life until you have 1',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              pick: {
                upTo: 1,
              },
            },
          },
        },
        {
          do: {
            trashLifeUntil: 1,
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        "K.O. up to 1 opponent Character with a cost of at most the total of both players' Life",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
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
  ],
  rulings: [
    'QA-EB01 EB01-059 (rulings.md RL-25): the [Trigger] total counts Life without the Trigger card itself',
  ],
};
