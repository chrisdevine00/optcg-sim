import type { CardScript } from '../../src/dsl.ts';

/** EB04-044 Koby. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_044: CardScript = {
  cardId: 'EB04-044',
  textHash: '03c70c1201f03f',
  verified: {
    source: 'cards/overrides/EB04-044.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        'Once per turn: if your Leader\'s type includes "Navy", instead of this Character being removed from the field, you may trash 1 card from your hand',
      kind: 'replacement',
      oncePerTurn: true,
      conditions: [{ leader: { typeIncludes: 'Navy' } }],
      replaces: {
        leaveField: { from: 'characters', owner: 'you', filter: { isSelf: true } },
        cause: 'any',
      },
      optional: true,
      instead: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
    },
    {
      id: 'draw',
      label: "Your turn, once per turn: when your opponent's Character is K.O.'d, draw 1 card",
      kind: 'auto',
      when: [{ event: 'koed', owner: 'opponent', filter: { category: ['Character'] } }],
      oncePerTurn: true,
      conditions: [{ yourTurn: true }],
      effect: [{ do: { draw: 1 } }],
    },
  ],
  rulings: [
    'G14 (any cause): "removed from the field" covers a battle K.O., your own effects and an opponent effect; the trash is paid from the hand as the replacement',
    'reading: the Navy condition reads the Leader as the removal happens',
    'the Character-area overflow trash (a sixth Character, CR 3-7-6-1-1) is rule processing and is not replaced: no offer when Koby is the one chosen (M6b-Q5)',
  ],
};
