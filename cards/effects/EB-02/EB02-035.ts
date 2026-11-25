import type { CardScript } from '../../src/dsl.ts';

/** EB02-035 Sanji & Pudding. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_035: CardScript = {
  cardId: 'EB02-035',
  textHash: '110bd2eb2cf531',
  verified: {
    source: 'cards/overrides/EB02-035.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'don-returned',
      label:
        'When 2 or more DON!! cards on your field are returned to your DON!! deck, add up to 1 DON!! card from your DON!! deck and set it as active',
      kind: 'auto',
      when: [{ event: 'donReturned', owner: 'you', min: 2 }],
      oncePerTurn: true,
      conditions: [{ yourTurn: true }],
      effect: [{ do: { addDon: [{ n: 1, state: 'active', upTo: true }] } }],
    },
    {
      id: 'on-play',
      label:
        "If the number of DON!! cards on your field is equal to or less than the number on your opponent's field, draw 1 card",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { cmp: [{ donOnField: 'you' }, '<=', { donOnField: 'opponent' }] },
          then: [{ do: { draw: 1 } }],
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q31 family): a DON!! -N cost counts as a return, so it fires the [Your Turn] ability; one event of the whole count: two separate returns of 1 do not make 2',
    'reading: the [On Play] "If" is an effect condition (colon-less): the number of DON!! on the field includes given DON!! and rested ones, equal counts qualify (draws at <=)',
  ],
};
