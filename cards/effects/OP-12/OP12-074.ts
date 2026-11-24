import type { CardScript } from '../../src/dsl.ts';

/** OP12-074 Patty. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_074: CardScript = {
  cardId: 'OP12-074',
  textHash: '0ea865252c39cb',
  verified: {
    source: 'cards/overrides/OP12-074.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 1 Event from your hand: if your Leader is [Sanji], add up to 1 DON!! and set it as active',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: { category: ['Event'] },
            pick: { exactly: 1 },
          },
        },
      ],
      effect: [
        {
          if: { leader: { name: 'Sanji' } },
          then: [{ do: { addDon: [{ n: 1, state: 'active', upTo: true }] } }],
        },
      ],
    },
  ],
  rulings: [
    'Reading: the Leader check follows the colon, so the Event is trashed (the cost is paid) even when the Leader is not [Sanji] and then nothing is added',
  ],
};
