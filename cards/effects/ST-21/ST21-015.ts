import type { CardScript } from '../../src/dsl.ts';

/** ST21-015 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST21_015: CardScript = {
  cardId: 'ST21-015',
  textHash: '1fd14a5ff1b5b9',
  verified: {
    source: 'cards/overrides/ST21-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label: '[DON!! x2] This Character gains [Rush]',
      kind: 'permanent',
      conditions: [{ donGiven: 2 }],
      apply: [{ grant: { target: { from: 'self', owner: 'you' }, keyword: 'Rush' } }],
    },
    {
      id: 'on-ko',
      label:
        'Play up to 1 red Character card with 6000 power or less other than [Roronoa Zoro] from your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { color: 'Red' },
                    { power: { lte: 6000 } },
                    { not: { name: 'Roronoa Zoro' } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: [DON!! x2] covers the Rush line only; [On K.O.] is its own line and needs no DON!!; "gains [Rush]" is printed with the keyword so it is the [Rush] keyword and is lost when fewer than 2 DON!! are given',
    'reading: the 6000 is the printed power of the card in hand; a Character card with no power (none exists) would not match',
  ],
};
