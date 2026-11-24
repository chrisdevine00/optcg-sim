import type { CardScript } from '../../src/dsl.ts';

/** OP14-115 Rindo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_115: CardScript = {
  cardId: 'OP14-115',
  textHash: '19a168b2102417',
  verified: {
    source: 'cards/overrides/OP14-115.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        "Opponent's turn: add up to 1 card from the top of your deck to the top of your Life, then take 1 damage",
      kind: 'auto',
      when: ['onKO'],
      conditions: [{ opponentsTurn: true }],
      effect: [
        {
          do: {
            move: {
              what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
              to: { zone: 'life', position: 'top' },
            },
          },
        },
        { do: { damage: { player: 'you', n: 1 } } },
      ],
    },
    {
      id: 'trigger',
      label: 'If your Leader has the {Kuja Pirates} type, play this card',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { type: 'Kuja Pirates' } },
          then: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, you take 1 damage" follows the "up to 1" instruction whether or not a card was added (no "if you do", and no failed "If" before it)',
    'G36: the damage is real damage (a Life card is taken and the [Trigger] decision is asked)',
  ],
};
