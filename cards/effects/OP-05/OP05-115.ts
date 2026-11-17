import type { CardScript } from '../../src/dsl.ts';

/** OP05-115 Two-Hundred Million Volts Amaru. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP05_115: CardScript = {
  cardId: 'OP05-115',
  textHash: '063598be961c08',
  verified: {
    source: 'cards/overrides/OP05-115.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Up to 1 of your Leader or Characters gains +3000 power this turn; if you have 1 or less Life, rest up to 1 of your opponent's Characters with cost 4 or less",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 3000,
              duration: 'thisTurn',
            },
          },
        },
        {
          if: { cmp: [{ life: 'you' }, '<=', 1] },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { cost: { lte: 4 } },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Trash 2 cards from your hand: add up to 1 deck card to the top of your Life',
      kind: 'trigger',
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 2 } } }],
      effect: [
        {
          do: {
            move: {
              what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
              to: { zone: 'life', position: 'top' },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: "Then, if you have 1 or less Life" is checked whether or not a power target was chosen',
  ],
};
