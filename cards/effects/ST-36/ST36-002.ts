import type { CardScript } from '../../src/dsl.ts';

/** ST36-002 Killer. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST36_002: CardScript = {
  cardId: 'ST36-002',
  textHash: '1905fec019cbc6',
  verified: {
    source: 'cards/overrides/ST36-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Your Turn, On Play: if your Leader has the {Kid Pirates} type, add up to 1 card from the top of your deck to the top of your Life cards',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [{ yourTurn: true }, { leader: { type: 'Kid Pirates' } }],
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
    {
      id: 'trigger',
      label: 'If your opponent has 3 or less Life cards, play this card',
      kind: 'trigger',
      effect: [
        {
          if: { cmp: [{ life: 'opponent' }, '<=', 3] },
          then: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
        },
      ],
    },
  ],
  rulings: [
    'Reading: "[Your Turn] [On Play]" is the On Play effect gated to your own turn, so a copy played from Life by its [Trigger] on the opponent\'s turn does not add Life',
    'Reading: the [Trigger] "If ..., play this card" is an effect condition (comma, no colon): the Trigger may be activated and does nothing when the opponent has 4 or more Life',
  ],
};
