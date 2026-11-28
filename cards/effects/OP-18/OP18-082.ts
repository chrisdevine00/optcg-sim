import type { CardScript } from '../../src/dsl.ts';

/** OP18-082 Catarina Devon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_082: CardScript = {
  cardId: 'OP18-082',
  textHash: '052a23ee9b6281',
  verified: {
    source: 'cards/overrides/OP18-082.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "This Character's base power becomes the same as your opponent's Leader's power during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            setBasePower: {
              target: {
                from: 'self',
                owner: 'you',
              },
              value: {
                statOf: {
                  from: 'leader',
                  owner: 'opponent',
                },
                stat: 'power',
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        'You may trash 1 card from your hand: if your Leader has the {Blackbeard Pirates} type, play this Character card from your trash rested',
      kind: 'auto',
      when: ['onKO'],
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
              type: 'Blackbeard Pirates',
            },
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: {
                      isSelf: true,
                    },
                    pick: {
                      exactly: 1,
                    },
                  },
                  rested: true,
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    "audit Q13 (proposed reading): the opponent Leader's power is read once, as the effect resolves (a snapshot, not a continuing link); it is the current power, given DON!! and modifiers included. The new base power lasts this turn",
    'reading (B3A-R1): the Leader check after the colon is an effect condition: the cost is paid either way',
  ],
};
