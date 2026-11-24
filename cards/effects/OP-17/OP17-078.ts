import type { CardScript } from '../../src/dsl.ts';

/** OP17-078 Drunken Dragon Bagua. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_078: CardScript = {
  cardId: 'OP17-078',
  textHash: '03c1bd043c00d5',
  verified: {
    source: 'cards/overrides/OP17-078.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Rest 2 DON!! and trash 2 cards: with an {Animal Kingdom Pirates} Leader, add up to 3 rested DON!!',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [{ restDon: 2 }, { trash: { from: 'hand', owner: 'you', pick: { exactly: 2 } } }],
      effect: [
        {
          if: { leader: { type: 'Animal Kingdom Pirates' } },
          then: [{ do: { addDon: [{ n: 3, state: 'rested', upTo: true }] } }],
        },
      ],
    },
    {
      id: 'counter',
      label: 'Up to 1 of your Leader or Characters gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 4000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'DECISIONS 2026-11-09 B-1: an Event worded "You may <cost>:" asks the cost after the card is played and it may be declined',
  ],
};
