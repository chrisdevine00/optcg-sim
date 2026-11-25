import type { CardScript } from '../../src/dsl.ts';

/** OP13-100 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_100: CardScript = {
  cardId: 'OP13-100',
  textHash: '154c658864e4b0',
  verified: {
    source: 'cards/overrides/OP13-100.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give-don',
      label:
        'Your Turn, Once Per Turn, when you play a Character with a [Trigger]: give up to 2 rested DON!! to your Leader or 1 Character',
      kind: 'auto',
      optional: true,
      oncePerTurn: true,
      conditions: [
        {
          yourTurn: true,
        },
      ],
      when: [
        {
          event: 'cardPlayed',
          by: 'you',
          filter: {
            all: [
              {
                category: ['Character'],
              },
              {
                hasTrigger: true,
              },
            ],
          },
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
