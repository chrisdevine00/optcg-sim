import type { CardScript } from '../../src/dsl.ts';

/** OP12-081 Koala. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_081: CardScript = {
  cardId: 'OP12-081',
  textHash: '0132100125e954',
  verified: {
    source: 'cards/overrides/OP12-081.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack-draw',
      label:
        "When this Leader attacks your opponent's Leader, with 2+ Characters of cost 8+: draw 1",
      kind: 'auto',
      when: [
        {
          event: 'attack',
          attacker: {
            from: 'leader',
            owner: 'you',
          },
          target: {
            from: 'leader',
            owner: 'opponent',
          },
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    cost: {
                      gte: 8,
                    },
                  },
                },
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'opp-play-life',
      label:
        'Once per turn, when your opponent plays a Character with base cost 8+ or plays a Character with a Character effect: they add 1 top Life card to their hand',
      kind: 'auto',
      oncePerTurn: true,
      when: [
        {
          event: 'cardPlayed',
          by: 'opponent',
          filter: {
            all: [
              {
                category: ['Character'],
              },
              {
                baseCost: {
                  gte: 8,
                },
              },
            ],
          },
        },
        {
          event: 'cardPlayed',
          by: 'opponent',
          via: 'characterEffect',
          filter: {
            category: ['Character'],
          },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'lifeTop',
                owner: 'opponent',
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
    },
  ],
  rulings: [
    'reading: "Characters with a cost of 8 or more" for the draw uses current cost; the Once Per Turn is shared by both play triggers and counts only when the effect resolves from one of them',
    'reading: "your opponent adds 1 card from the top of their Life cards to their hand" is not damage (no [Trigger]) and needs no choice; with no Life nothing happens',
  ],
};
