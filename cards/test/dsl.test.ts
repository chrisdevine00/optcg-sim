/**
 * The effect-script schema (effect-dsl.md E-D1): every registered script validates, its text hash
 * matches the card data it was written from (so changed upstream text fails CI until the script is
 * re-verified), and its printed keywords equal the verified override's (E-D7). The validator itself
 * is checked against hand-made good and bad scripts.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { CardScript } from '../src/dsl.ts';
import { textHash } from '../src/dsl.ts';
import { validateScript } from '../src/dsl-validate.ts';
import type { Card, SetFile } from '../src/schema.ts';
import { SCRIPTS } from '../effects/index.ts';

const byId = new Map<string, Card>();
for (const f of readdirSync(new URL('../data/sets/', import.meta.url))) {
  const set = JSON.parse(
    readFileSync(new URL(`../data/sets/${f}`, import.meta.url), 'utf8'),
  ) as SetFile;
  for (const c of set.cards) byId.set(c.id, c);
}

const good: CardScript = {
  cardId: 'OP17-058',
  textHash: 'x',
  verified: { source: 'test', date: '2026-10-28' },
  abilities: [
    {
      id: 'shrink',
      kind: 'auto',
      when: ['whenAttacking', 'onOpponentAttack'],
      oncePerTurn: true,
      cost: [{ donMinus: 1 }],
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 }, bind: 't' },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
        { do: { ko: { from: 'characters', owner: 'opponent', filter: { ref: 't' } } } },
      ],
    },
  ],
};

const variant = (patch: (s: CardScript) => void): CardScript => {
  const s = structuredClone(good);
  patch(s);
  return s;
};

describe('validateScript', () => {
  it('accepts a well-formed script', () => {
    expect(validateScript(good)).toEqual([]);
  });

  it('rejects unknown keys, missing fields and bad values', () => {
    expect(validateScript({ ...good, extra: 1 })).not.toEqual([]);
    expect(validateScript(variant((s) => Reflect.deleteProperty(s, 'textHash')))).not.toEqual([]);
    const badDuration = variant((s) => {
      const a = s.abilities[0] as { effect: { do: { power: { duration: string } } }[] };
      a.effect[0]!.do.power.duration = 'forever';
    });
    expect(validateScript(badDuration).join()).toMatch(/duration/);
  });

  it('rejects a ref that no earlier selector binds, and an ifDid with no may', () => {
    const unbound = variant((s) => {
      const a = s.abilities[0] as { effect: unknown[] };
      a.effect.reverse();
    });
    expect(validateScript(unbound).join()).toMatch(/no earlier selector binds/);
    const noMay = variant((s) => {
      (s.abilities[0] as { effect: unknown[] }).effect.push({ ifDid: 'x', then: [] });
    });
    expect(validateScript(noMay).join()).toMatch(/no earlier "may"/);
  });

  it('requires exact picks inside costs (E-D6)', () => {
    const upTo = variant((s) => {
      (s.abilities[0] as { cost: unknown[] }).cost = [
        { trash: { from: 'hand', owner: 'you', pick: { upTo: 1 } } },
      ];
    });
    expect(validateScript(upTo).join()).toMatch(/must be "exactly"/);
  });

  it('rejects vocabulary the runtime does not implement yet, and $-prefixed or duplicate ids', () => {
    const forEach = variant((s) => {
      (s.abilities[0] as { effect: unknown[] }).effect.push({ forEach: 1, do: [] });
    });
    expect(validateScript(forEach).join()).toMatch(/not implemented/);
    const dollar = variant((s) => (s.abilities[0]!.id = '$abc1234'));
    expect(validateScript(dollar).join()).toMatch(/must match/);
    const dup = variant((s) => s.abilities.push(structuredClone(s.abilities[0]!)));
    expect(validateScript(dup).join()).toMatch(/duplicate/);
  });
});

describe('registered scripts', () => {
  const scripts = Object.values(SCRIPTS);

  it.each(scripts.map((s) => [s.cardId, s] as const))('%s validates', (_id, s) => {
    expect(validateScript(s)).toEqual([]);
  });

  it.each(scripts.map((s) => [s.cardId, s] as const))(
    '%s matches its verified card text and keywords',
    (id, s) => {
      const card = byId.get(id);
      expect(card, `${id} is not in the card data`).toBeDefined();
      expect(card!.verified).toBe(true);
      expect(s.textHash, `${id}: card text changed; re-verify the script`).toBe(
        textHash(card!.effectText, card!.triggerText),
      );
      expect([...(s.keywords ?? [])].sort()).toEqual([...card!.keywords].sort());
    },
  );

  it('files live at cards/effects/<SET>/<CARD-ID>.ts', () => {
    for (const s of scripts) {
      const card = byId.get(s.cardId)!;
      const file = new URL(`../effects/${card.set}/${s.cardId}.ts`, import.meta.url);
      expect(() => readFileSync(file)).not.toThrow();
    }
  });
});
