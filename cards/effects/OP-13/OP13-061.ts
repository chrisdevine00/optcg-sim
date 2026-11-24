import type { CardScript } from '../../src/dsl.ts';

/** OP13-061 Inuarashi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_061: CardScript = {
  cardId: 'OP13-061',
  textHash: '132ccc6de75906',
  verified: {
    source: 'cards/overrides/OP13-061.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'With any DON!! given: add up to 1 DON!! rested, then K.O. up to 1 opposing Character with a cost of 1 or less',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                donGiven: 'you',
              },
              '>=',
              1,
            ],
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 1,
                    },
                  },
                  pick: {
                    upTo: 1,
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
    'reading: "Then" is inside the "If" (EB05-033, audit Q10) and is not "If you do": the K.O. happens after a declined or empty DON!! add; nothing at all happens with no DON!! given',
    'reading: "any DON!! cards given" counts DON!! given to your Leader and your Characters; "a cost of 1 or less" is the current cost',
  ],
};
