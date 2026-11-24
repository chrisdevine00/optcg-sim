import type { CardScript } from '../../src/dsl.ts';

/** OP04-096 Corrida Coliseum. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP04_096: CardScript = {
  cardId: 'OP04-096',
  textHash: '0ff207fc32422b',
  verified: {
    source: 'cards/overrides/OP04-096.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush-character',
      label:
        'If your Leader has the {Dressrosa} type, your {Dressrosa} Characters can attack Characters on the turn in which they are played',
      kind: 'permanent',
      conditions: [{ leader: { type: 'Dressrosa' } }],
      apply: [
        {
          grant: {
            target: { from: 'characters', owner: 'you', filter: { type: 'Dressrosa' } },
            keyword: 'Rush: Character',
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: granting [Rush: Character] is exactly "can attack Characters on the turn in which they are played"; the Leader type is an exact {Dressrosa} element, checked continuously',
  ],
};
