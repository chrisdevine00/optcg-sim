import type { CardScript } from '../../src/dsl.ts';

/** OP15-046 Sabo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_046: CardScript = {
  cardId: 'OP15-046',
  textHash: '1ed1410ad83a4d',
  verified: {
    source: 'card text in cards/data (Limitless cross-check 2026-11-24); official OP15 Q&A',
    date: '2026-11-25',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'On Play: if your Leader has the {Dressrosa} type, activate up to 1 {Dressrosa} type Event from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { type: 'Dressrosa' } },
          then: [
            {
              do: {
                activate: {
                  ability: 'main',
                  of: {
                    from: 'hand',
                    owner: 'you',
                    filter: { all: [{ category: ['Event'] }, { type: 'Dressrosa' }] },
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
    'Reading (M6b-Q27, official OP15 Q&A for OP15-046): "unless the Event card specifies otherwise, it will be placed in the trash" after its effect resolves; an Event\'s [Counter] cannot be activated in response to this [On Play] (it is not the Counter Step); no cost limit, so any {Dressrosa} Event whose [Main] is activatable (printed cost not paid, its own activation cost paid)',
    'Reading (M6b-Q28): counts as an Event activation for watchers (official OP12 Q&A for OP12-041, the same hand activation)',
    '[Blocker] is the keyword of the data. The "If" with no colon is an effect condition (DECISIONS 2026-11-24 B3A-R1): with a non-{Dressrosa} Leader the [On Play] still triggers and does nothing',
  ],
};
