import type { CardScript } from '../../src/dsl.ts';

/** OP15-014 Bartolomeo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_014: CardScript = {
  cardId: 'OP15-014',
  textHash: '027edae01efd1f',
  verified: {
    source: 'card text in cards/data (Limitless cross-check 2026-11-24); official OP15 Q&A',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'ko-shield',
      label: "If this Character would be K.O.'d, you may trash 1 Event from your hand instead",
      kind: 'replacement',
      replaces: { ko: { from: 'characters', owner: 'you', filter: { isSelf: true } } },
      optional: true,
      instead: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: { category: ['Event'] },
            pick: { exactly: 1 },
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'On Play: activate up to 1 {Dressrosa} type Event with a base cost of 3 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            activate: {
              ability: 'main',
              of: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [{ category: ['Event'] }, { type: 'Dressrosa' }, { baseCost: { lte: 3 } }],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading (M6b-Q27, official OP15 Q&A for OP15-046 Sabo): the Event activated by an [On Play] goes to the trash after its effect resolves unless it says otherwise; its printed cost is not paid, its own activation cost is (official OP12-041 Q&A, the same activation)',
    'Reading (M6b-Q28): counts as activating an Event for watchers, as OP12-041 does (OP12 Q&A: "When you activate an Event" effects can be activated)',
    'The replacement has no Once Per Turn and no cause: it covers every K.O. of this Character (battle or effect); the Event trashed is a card of any kind of Event in the hand',
  ],
};
