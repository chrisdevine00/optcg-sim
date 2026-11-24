import type { CardScript } from '../../src/dsl.ts';

/** OP11-001 Koby. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_001: CardScript = {
  cardId: 'OP11-001',
  textHash: '02f56d7a3fbb7f',
  verified: {
    source: 'cards/overrides/OP11-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'sword-rush',
      label: 'Your {SWORD} Characters can attack Characters on the turn they are played',
      kind: 'permanent',
      apply: [
        {
          grant: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                type: 'SWORD',
              },
            },
            keyword: 'Rush: Character',
          },
        },
      ],
    },
    {
      id: 'navy-shield',
      label:
        "Once per turn: instead of your {Navy} Character (7000 base power or less) being removed by the opponent's effect, place 3 cards from your trash at the bottom of your deck",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            all: [
              {
                type: 'Navy',
              },
              {
                basePower: {
                  lte: 7000,
                },
              },
            ],
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          move: {
            from: 'trash',
            owner: 'you',
            pick: {
              exactly: 3,
            },
          },
          to: {
            zone: 'deck',
            position: 'bottom',
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "can attack Characters on the turn in which they are played" is [Rush: Character], granted to every {SWORD} Character on the field (the Leader is not a Character)',
    'reading: "removed from the field by your opponent\'s effect" covers a K.O., bounce, trash or deck move by the opponent\'s effect (as OP15-035); the Character is matched by base power (buffs do not matter); Once Per Turn is spent when the replacement is used',
    'reading: the 3 trash cards are an exact cost of the replacement (not offered with fewer than 3) and the owner orders them at the bottom',
  ],
};
