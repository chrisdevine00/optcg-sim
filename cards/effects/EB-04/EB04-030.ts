import type { CardScript } from '../../src/dsl.ts';

/** EB04-030 Kaido. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_030: CardScript = {
  cardId: 'EB04-030',
  textHash: '1ee4fd26bc30cb',
  verified: {
    source: 'cards/overrides/EB04-030.json (card text in cards/data)',
    date: '2026-10-28',
    note: '"gains Rush" is printed without brackets; it is the [Rush] keyword (effect-dsl §1.5)',
  },
  abilities: [
    {
      id: 'ko-shield',
      label: 'Return 1 DON!! card from your field instead',
      kind: 'replacement',
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
      },
      optional: true,
      instead: [
        {
          returnDon: 1,
        },
      ],
    },
    {
      id: 'on-play',
      label: "Gains Rush; then rest up to 1 of your opponent's Characters with a cost of 7 or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 2,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Animal Kingdom Pirates',
            },
          },
          then: [
            {
              do: {
                grant: {
                  target: {
                    from: 'self',
                    owner: 'you',
                  },
                  keyword: 'Rush',
                  duration: 'thisTurn',
                },
              },
            },
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 7,
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
};
