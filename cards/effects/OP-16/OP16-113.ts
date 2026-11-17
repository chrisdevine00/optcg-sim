import type { CardScript } from '../../src/dsl.ts';

/** OP16-113 Boa Marigold. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_113: CardScript = {
  cardId: 'OP16-113',
  textHash: '1ff1965dd34600',
  verified: {
    source: 'cards/overrides/OP16-113.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'blocker-grant',
      label: 'With 2 or less Life, this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              life: 'you',
            },
            '<=',
            2,
          ],
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'If your Leader has the {Kuja Pirates} type, play this card',
      kind: 'trigger',
      effect: [
        {
          if: {
            leader: {
              type: 'Kuja Pirates',
            },
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'self',
                    owner: 'you',
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
