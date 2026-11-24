import type { CardScript } from '../../src/dsl.ts';

/** EB04-001 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_001: CardScript = {
  cardId: 'EB04-001',
  textHash: '040713014675e7',
  verified: {
    source: 'cards/overrides/EB04-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-turn-power',
      label: "[Opponent's Turn] If you have 1 or less Life cards, this Leader gains +2000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          cmp: [
            {
              life: 'you',
            },
            '<=',
            1,
          ],
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'leader',
              owner: 'you',
            },
            amount: 2000,
          },
        },
      ],
    },
    {
      id: 'activate',
      label:
        "Give up to 1 of your opponent's Characters -1000 power; then, with 2 or more Life, you may add the top Life card to your hand",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
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
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              may: [
                {
                  do: {
                    move: {
                      what: {
                        from: 'lifeTop',
                        owner: 'you',
                        pick: {
                          exactly: 1,
                        },
                      },
                      to: {
                        zone: 'hand',
                      },
                    },
                  },
                },
              ],
              label: 'life',
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, if you have 2 or more Life cards" is gated inside the If (M4b-5); the Life count is checked after the power step and is not changed by it; the Life card goes to the hand with no [Trigger] (not damage)',
    'reading: "this Leader gains +2000" is a continuous effect on the opponent\'s turn while Life is 1 or less (checked live, so it turns on when Life drops during a battle)',
  ],
};
