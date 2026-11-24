import type { CardScript } from '../../src/dsl.ts';

/** OP12-087 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_087: CardScript = {
  cardId: 'OP12-087',
  textHash: '00be035c818c9b',
  verified: {
    source: 'cards/overrides/OP12-087.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker-cost',
      label:
        'With a [Koala] or [Monkey.D.Luffy] Leader, this Character gains [Blocker] and +3 cost',
      kind: 'permanent',
      conditions: [
        {
          any: [
            {
              leader: {
                name: 'Koala',
              },
            },
            {
              leader: {
                name: 'Monkey.D.Luffy',
              },
            },
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
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 3,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'You may trash 1 card from your hand: if your opponent has 5+ cards in hand, they trash 2 cards',
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
            cmp: [
              {
                hand: 'opponent',
              },
              '>=',
              5,
            ],
          },
          then: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'opponent',
                  chooser: 'opponent',
                  pick: {
                    exactly: 2,
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
