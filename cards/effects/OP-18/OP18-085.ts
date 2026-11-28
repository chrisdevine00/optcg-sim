import type { CardScript } from '../../src/dsl.ts';

/** OP18-085 Cerberus. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_085: CardScript = {
  cardId: 'OP18-085',
  textHash: '1f825701cd4b48',
  verified: {
    source: 'cards/overrides/OP18-085.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "You may return this Character to the owner's hand: up to 1 of your [Saint Shamrock] Characters gains [Rush], [Banish] or [Unblockable] during this turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          move: {
            from: 'self',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'hand',
          },
        },
      ],
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: {
                name: 'Saint Shamrock',
              },
            },
          },
          then: [
            {
              chooseOne: [
                [
                  {
                    do: {
                      grant: {
                        target: {
                          from: 'characters',
                          owner: 'you',
                          filter: {
                            name: 'Saint Shamrock',
                          },
                          pick: {
                            upTo: 1,
                          },
                        },
                        keyword: 'Rush',
                        duration: 'thisTurn',
                      },
                    },
                  },
                ],
                [
                  {
                    do: {
                      grant: {
                        target: {
                          from: 'characters',
                          owner: 'you',
                          filter: {
                            name: 'Saint Shamrock',
                          },
                          pick: {
                            upTo: 1,
                          },
                        },
                        keyword: 'Banish',
                        duration: 'thisTurn',
                      },
                    },
                  },
                ],
                [
                  {
                    do: {
                      grant: {
                        target: {
                          from: 'characters',
                          owner: 'you',
                          filter: {
                            name: 'Saint Shamrock',
                          },
                          pick: {
                            upTo: 1,
                          },
                        },
                        keyword: 'Unblockable',
                        duration: 'thisTurn',
                      },
                    },
                  },
                ],
              ],
              labels: ['Gains [Rush]', 'Gains [Banish]', 'Gains [Unblockable]'],
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'audit Q17 (proposed reading): the player chooses one of the three keywords, then the Character; the return to the hand is a cost paid first and stays paid whether or not a [Saint Shamrock] is there',
    'reading: the keyword choice is asked only when you have a [Saint Shamrock] Character (a public field fact; with none nothing could be granted)',
  ],
};
