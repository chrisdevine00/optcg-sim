import type { CardScript } from '../../src/dsl.ts';

/** EB02-010 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_010: CardScript = {
  cardId: 'EB02-010',
  textHash: '10fa00f0af3c3d',
  verified: {
    source: 'cards/overrides/EB02-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'set-active',
      label:
        "DON!! -2: if the only Characters are {Straw Hat Crew}, set up to 2 DON!! active; Leader +1000 until the end of your opponent's next turn",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          donMinus: 2,
        },
      ],
      effect: [
        {
          if: {
            all: [
              {
                exists: {
                  from: 'characters',
                  owner: 'you',
                },
              },
              {
                none: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    not: {
                      type: 'Straw Hat Crew',
                    },
                  },
                },
              },
            ],
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'donCostArea',
                  owner: 'you',
                  pick: {
                    upTo: 2,
                  },
                },
              },
            },
            {
              do: {
                power: {
                  target: {
                    from: 'leader',
                    owner: 'you',
                  },
                  amount: 1000,
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "the only Characters on your field are {Straw Hat Crew}" is false with no Characters (at least one, all of the type); an effect condition after the cost colon, so the DON!! -2 and Once Per Turn are spent when it fails',
    'reading: "Then, this Leader gains +1000" is inside the condition (M4b-5); the duration is the plain "until the end of your opponent\'s next turn"; "up to 2" DON!! asks a count of the rested ones',
  ],
};
