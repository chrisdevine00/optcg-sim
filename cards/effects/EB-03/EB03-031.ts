import type { CardScript } from '../../src/dsl.ts';

/** EB03-031 Vinsmoke Reiju. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_031: CardScript = {
  cardId: 'EB03-031',
  textHash: '0a75df504cdfea',
  verified: {
    source: 'card text in cards/data (Limitless cross-check 2026-11-24); official EB03 Q&A',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Your Turn, On Play, DON!! -1: if your Leader is [Sanji], activate the [Main] effect of up to 1 Event card with a cost of 7 or less in your trash',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [{ yourTurn: true }],
      cost: [{ donMinus: 1 }],
      effect: [
        {
          if: { leader: { name: 'Sanji' } },
          then: [
            {
              do: {
                activate: {
                  ability: 'main',
                  of: {
                    from: 'trash',
                    owner: 'you',
                    filter: { all: [{ category: ['Event'] }, { cost: { lte: 7 } }] },
                    pick: { upTo: 1 },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Reading (M6b-Q27): only the [Main] effect is activated and the Event card stays in the trash ("the [Main] effect", not the card); the activation cost written in that effect is still paid, so an Event whose cost cannot be paid is not offered',
    'Reading (M6b-Q28, official EB03 Q&A for EB03-031): activating the [Main] effect of an Event with this [On Play] "differs from activating the Event card itself", so "When you activate an Event" effects (OP04-053 Page One) cannot be activated and no Event activation is recorded',
    'The cost is the Event\'s cost in the trash, its printed cost (7 or less). The "If" after the cost colon is an effect condition: with another Leader the DON!! -1 is paid for nothing. [Your Turn] is an ability condition',
  ],
};
