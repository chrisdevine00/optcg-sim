import type { CardScript } from '../../src/dsl.ts';

/** ST16-001 Uta. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST16_001: CardScript = {
  cardId: 'ST16-001',
  textHash: '1d836417b18a35',
  verified: {
    source: 'cards/overrides/ST16-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'activate',
      label:
        'Once per turn: you may trash 1 "FILM" type card from your hand: give up to 1 rested DON!! card to your Leader or 1 of your Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: { type: 'FILM' },
            pick: { exactly: 1 },
          },
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the cost is paid even with no rested DON!! to give; the trashed card must be a card of the {FILM} type (any category)',
  ],
};
