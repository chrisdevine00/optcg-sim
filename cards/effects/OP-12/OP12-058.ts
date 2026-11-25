import type { CardScript } from '../../src/dsl.ts';

/**
 * OP12-058 I Will Make Whitebeard the King of the Pirates. Scripted from the verified text in
 * cards/data (effect-dsl.md E-D1).
 */
export const OP12_058: CardScript = {
  cardId: 'OP12-058',
  textHash: '0f68b021f4445d',
  verified: {
    source: 'cards/overrides/OP12-058.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'If your Leader has a type including "Whitebeard Pirates", reveal the top card of your deck; if it is a Whitebeard Pirates Character with a cost of 9 or less, you may play it; if you do, it gains [Rush] during this turn',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: { leader: { typeIncludes: 'Whitebeard Pirates' } },
          then: [
            { do: { reveal: { from: 'deckTop', n: 1, bind: 'revealed' } } },
            {
              if: {
                ref: 'revealed',
                matches: {
                  all: [
                    { category: ['Character'] },
                    { typeIncludes: 'Whitebeard Pirates' },
                    { cost: { lte: 9 } },
                  ],
                },
              },
              then: [
                {
                  may: [
                    {
                      do: {
                        play: {
                          what: {
                            from: 'deckTop',
                            owner: 'you',
                            filter: { ref: 'revealed' },
                            pick: { exactly: 1 },
                          },
                        },
                      },
                    },
                  ],
                  label: 'play',
                },
                {
                  ifDid: 'play',
                  then: [
                    {
                      do: {
                        grant: {
                          target: {
                            from: 'characters',
                            owner: 'you',
                            filter: { ref: 'revealed' },
                          },
                          keyword: 'Rush',
                          duration: 'thisTurn',
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [{ do: { draw: 1 } }],
    },
  ],
  rulings: [
    'reading (G53): the card must still be the top card the reveal showed; it is public to both players, so playing it is no secret and the only question is the card\'s own "you may"; a card that is not played stays on top of the deck',
    'reading: the two "If" clauses have no colon, so they are effect conditions: the [Main] is played (the Event is paid and trashed) whatever the Leader is; "type including" is a substring of a type for the Leader and for the revealed Character (CR 2-4-3-1), a Whitebeard Pirates card that is not a Character is not played',
    'reading: "cost of 9 or less" reads the revealed card\'s cost; "If you do" is the accepted play',
  ],
};
