import type { CardScript } from '../../src/dsl.ts';

/** EB02-019 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_019: CardScript = {
  cardId: 'EB02-019',
  textHash: '18726b26357d87',
  verified: {
    source: 'cards/overrides/EB02-019.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush-character',
      label:
        'If your opponent has 2 or more Characters, this Character can attack Characters on the turn it is played',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              count: {
                from: 'characters',
                owner: 'opponent',
              },
            },
            '>=',
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
            keyword: 'Rush: Character',
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        "If your Leader has {Straw Hat Crew}: rest up to 1 of the opponent's Characters with cost 4 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Straw Hat Crew',
            },
          },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 4,
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
    'reading: "can attack Characters on the turn in which it is played" is [Rush: Character] while the opponent has 2 or more Characters (checked continuously)',
  ],
};
