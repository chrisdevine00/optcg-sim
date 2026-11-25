import type { CardScript } from '../../src/dsl.ts';

/** OP12-041 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_041: CardScript = {
  cardId: 'OP12-041',
  textHash: '1121f5af08ac3d',
  verified: {
    source: 'card text in cards/data (Limitless cross-check 2026-11-24); official OP12 Q&A',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'activate-event',
      label:
        'Activate: Main, Once Per Turn, DON!! -1: activate up to 1 "Straw Hat Crew" type Event with a base cost of 3 or less from your hand',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [{ donMinus: 1 }],
      effect: [
        {
          do: {
            activate: {
              ability: 'main',
              of: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Event'] },
                    { type: 'Straw Hat Crew' },
                    { baseCost: { lte: 3 } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label:
        "When Attacking: if your DON!! on the field is equal to or less than your opponent's, add up to 1 DON!! from your DON!! deck and rest it",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          if: { cmp: [{ donOnField: 'you' }, '<=', { donOnField: 'opponent' }] },
          then: [{ do: { addDon: [{ n: 1, state: 'rested', upTo: true }] } }],
        },
      ],
    },
  ],
  rulings: [
    'Reading (M6b-Q27, official OP12 Q&A for OP12-041): the Event is trashed; its printed cost is not paid but an activation cost written in its effect (DON!! -2 on OP09-077) is, so an Event whose [Main] cost cannot be paid is not offered; only [Main] effects can be activated, never [Counter] or [Trigger]',
    'Reading (M6b-Q28, same Q&A): the Event counts as activated, so "When you activate an Event" effects (OP04-053 Page One) and the Events-activated history see it',
    'The count of DON!! on the field is the cost area plus given DON!! (rules-digest); "equal to or less" is `<=`. The "If" with no colon is an effect condition (DECISIONS 2026-11-24 B3A-R1)',
  ],
};
