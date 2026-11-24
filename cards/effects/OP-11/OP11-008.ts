import type { CardScript } from '../../src/dsl.ts';

/** OP11-008 Doll. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_008: CardScript = {
  cardId: 'OP11-008',
  textHash: '13f2c4da4fdd2b',
  verified: {
    source: 'cards/overrides/OP11-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 1 card from your hand: if your Leader has the {Navy} type, give up to 1 opponent Character -6000 power this turn',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Navy',
            },
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -6000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the Leader condition follows the colon, so the trash cost is paid first and the -6000 happens only with a {Navy} Leader',
  ],
};
