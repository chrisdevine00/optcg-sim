/**
 * Permanent effects as derive inputs (effect-dsl.md §4.9, CR 8-1-3-3). A `permanent` ability is
 * never stored as a modifier: `derive` asks this module, per stage, for the modifiers every live
 * permanent effect currently produces, and merges them with the stored ones.
 *
 * Stages (see `derive.ts`): 1 cost, 2 base power, 3 power, 4 keyword grants, 5 restrictions, 6 cost
 * of cards in hand. While
 * a stage's abilities are read (their conditions, their targets, their amounts), card values come
 * from the stages before it, so "if there is a Character with a cost of 12 or more, this gains
 * +3000 power" sees the +12 cost effects, and "base power becomes 8000 for a Character with 4000
 * base power" sees the printed value. A source with its effects negated (CR 8-2) produces nothing.
 */
import type { Continuous, Filter, Restriction, Selector } from '@optcg/cards';
import type { InstanceId } from '../api.ts';
import { deriveAt, type LayerMemo } from '../derive.ts';
import type { Ability } from '../abilities.ts';
import { PLAYERS, type ModKind, type Modifier, type State } from '../state.ts';
import { allHold, holds, num, pool, type Ctx } from './eval.ts';

type Permanent = Extract<Ability, { kind: 'permanent' }>;

const STAGE_OF: Record<string, number> = {
  cost: 1,
  setBasePower: 2,
  power: 3,
  grant: 4,
  restrict: 5,
  /** Cost effects of a card in hand: they read every field stage (OP15-013), never feed one. */
  handCost: 6,
};

const RESTRICT_KIND = {
  cannotAttack: 'cannotAttack',
  cannotBeKOd: 'cannotBeKOd',
  cannotBeRemovedByOpponentEffects: 'cannotBeRemoved',
  cannotActivateBlockerAgainstIt: 'noBlocker',
  cannotBeRested: 'cannotBeRested',
  cannotActivateBlocker: 'cannotBlock',
} as const;

/**
 * The modifier a card restriction makes (permanent and timed alike): its kind and, for the scoped
 * forms, what it covers. Undefined for a restriction that is not on cards (a player's draw, play).
 */
export function restrictionMod(
  what: Restriction,
):
  | { kind: ModKind; scope?: NonNullable<Modifier['scope']>; by?: Filter; filter?: Filter }
  | undefined {
  if (typeof what === 'string') {
    const kind = (RESTRICT_KIND as Record<string, ModKind | undefined>)[what];
    return kind ? { kind } : undefined;
  }
  if ('cannotBeKOd' in what)
    return {
      kind: 'cannotBeKOd',
      scope: what.cannotBeKOd.cause,
      ...(what.cannotBeKOd.by ? { by: what.cannotBeKOd.by } : {}),
    };
  if ('cannotBeRested' in what) return { kind: 'cannotBeRested', scope: what.cannotBeRested.by };
  if ('cannotAttackTarget' in what)
    return { kind: 'cannotAttackTarget', filter: what.cannotAttackTarget };
  return undefined;
}

/** The applies of an ability that hold now: `tiers` entries are cumulative (OP15-092). */
function flatten(c: Ctx, apply: readonly Continuous[], out: Continuous[] = []): Continuous[] {
  for (const ap of apply) {
    if ('tiers' in ap) {
      for (const t of ap.tiers) if (holds(c, t.when)) flatten(c, t.apply, out);
    } else out.push(ap);
  }
  return out;
}

const isSel = (t: Selector | string): t is Selector => typeof t === 'object';

function stageOfApply(ap: Continuous): number {
  if ('power' in ap) return STAGE_OF.power!;
  if ('setBasePower' in ap) return STAGE_OF.setBasePower!;
  if ('cost' in ap) return STAGE_OF.cost!;
  if ('grant' in ap) return STAGE_OF.grant!;
  if ('restrict' in ap) {
    const { target, what } = ap.restrict;
    return isSel(target) && restrictionMod(what) ? STAGE_OF.restrict! : 0;
  }
  return 0;
}

/** Bit `1 << stage` for every stage an apply list (tiers included) can produce modifiers in. */
function stageMask(apply: readonly Continuous[]): number {
  let m = 0;
  for (const ap of apply) {
    if ('tiers' in ap) for (const t of ap.tiers) m |= stageMask(t.apply);
    else {
      const st = stageOfApply(ap);
      if (st) m |= 1 << st;
    }
  }
  return m;
}

interface PermInfo {
  ab: Permanent;
  mask: number;
}

/** A card definition's permanent abilities with the stages each can contribute to (static). */
const permInfo = new WeakMap<object, readonly PermInfo[]>();
function permsOf(def: { abilities: readonly Ability[] }): readonly PermInfo[] {
  let v = permInfo.get(def);
  if (!v) {
    v = def.abilities
      .filter((a): a is Permanent => a.kind === 'permanent')
      .map((ab) => {
        let mask = stageMask(ab.apply);
        // A hand-zone cost effect moves to the last stage, so its conditions read the fully
        // derived power of the Leader and Characters (a field stage cannot read it: cycle).
        if (ab.zone === 'hand' && mask & (1 << STAGE_OF.cost!)) {
          mask = (mask & ~(1 << STAGE_OF.cost!)) | (1 << STAGE_OF.handCost!);
        }
        return { ab, mask };
      });
    permInfo.set(def, v);
  }
  return v;
}

/** The modifiers that stage `stage` of every live permanent effect produces, by target. */
export function computePerms(
  s: State,
  stage: number,
  memo: LayerMemo,
  live: boolean,
): Map<InstanceId, Modifier[]> {
  const out = new Map<InstanceId, Modifier[]>();
  const add = (m: Omit<Modifier, 'id'>) => {
    const list = out.get(m.target);
    const mod: Modifier = { ...m, id: -1 };
    if (list) list.push(mod);
    else out.set(m.target, [mod]);
  };
  for (const p of PLAYERS) {
    const ps = s.players[p];
    for (const src of [ps.leader, ...ps.characters, ...ps.stage, ...ps.hand]) {
      const card = s.cards[src]!;
      const abs = permsOf(s.defs[card.card]!);
      if (abs.length === 0) continue;
      const zone = card.zone === 'hand' ? 'hand' : 'field';
      let checkedNegation = false;
      for (const { ab, mask } of abs) {
        // Nothing to produce at this stage: reading the conditions has no effect, so skip them.
        if (!(mask & (1 << stage))) continue;
        if ((ab.zone ?? 'field') !== zone) continue;
        if (zone === 'field' && !checkedNegation) {
          checkedNegation = true;
          if (deriveAt(s, src, 0, memo, live).negated) break;
        }
        const c: Ctx = { s, you: p, self: src, live, lay: { upto: stage - 1, memo } };
        if (!allHold(c, ab.conditions)) continue;
        const base = {
          duration: { kind: 'whileSource', source: src } as const,
          controller: p,
          source: src,
        };
        for (const ap of flatten(c, ab.apply)) {
          if ('power' in ap) {
            if (stage !== STAGE_OF.power) continue;
            const amount = num(c, ap.power.amount);
            for (const id of pool(c, ap.power.target))
              add({ ...base, kind: 'power', target: id, amount });
          } else if ('setBasePower' in ap) {
            if (stage !== STAGE_OF.setBasePower) continue;
            const amount = num(c, ap.setBasePower.value);
            for (const id of pool(c, ap.setBasePower.target))
              add({ ...base, kind: 'basePower', target: id, amount });
          } else if ('cost' in ap) {
            if (stage !== (zone === 'hand' ? STAGE_OF.handCost : STAGE_OF.cost)) continue;
            const amount = num(c, ap.cost.amount);
            for (const id of pool(c, ap.cost.target))
              add({ ...base, kind: 'cost', target: id, amount });
          } else if ('grant' in ap) {
            if (stage !== STAGE_OF.grant) continue;
            for (const id of pool(c, ap.grant.target))
              add({ ...base, kind: 'grant', target: id, amount: 0, keyword: ap.grant.keyword });
          } else if ('restrict' in ap) {
            if (stage !== STAGE_OF.restrict) continue;
            const { target, what } = ap.restrict;
            const spec = restrictionMod(what);
            if (!isSel(target) || !spec) continue;
            for (const id of pool(c, target))
              add({
                ...base,
                kind: spec.kind,
                target: id,
                amount: 0,
                ...(spec.scope ? { scope: spec.scope } : {}),
                ...(spec.by ? { by: spec.by } : {}),
                ...(spec.filter ? { filter: spec.filter } : {}),
              });
          }
        }
      }
    }
  }
  return out;
}
