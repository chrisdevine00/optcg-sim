import type { CardScript } from '../../src/dsl.ts';

/** EB04-051 Emet. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_051: CardScript = {
  cardId: 'EB04-051',
  textHash: '1277b103c95bfa',
  verified: {
    source: 'cards/overrides/EB04-051.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'no-attack',
      label: 'Cannot attack unless there is a Character with 12000 base power or more',
      kind: 'permanent',
      conditions: [
        {
          none: {
            from: 'characters',
            owner: 'any',
            filter: {
              basePower: {
                gte: 12000,
              },
            },
          },
        },
      ],
      apply: [
        {
          restrict: {
            target: {
              from: 'self',
              owner: 'you',
            },
            what: 'cannotAttack',
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Give all opposing Characters -3000 power this turn; with 0 Life, play this card',
      kind: 'trigger',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
              },
              amount: -3000,
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
              '=',
              0,
            ],
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
