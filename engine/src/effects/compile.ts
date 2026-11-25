/**
 * Compiles an ability's costs and effect into a flat program, so a suspended effect frame needs
 * only an instruction pointer (ARCHITECTURE §2.4: frames are plain data). Control flow becomes
 * jumps. Programs are cached per ability object; scripts are immutable data.
 */
import type { Condition, Cost, EffectAction, Num, P } from '@optcg/cards';
import { isEffect } from '@optcg/cards';
import type { Ability, EStep, InternalStep } from '../abilities.ts';
import { isInternal } from '../abilities.ts';

export type Instr =
  /** `list` and `at`: the flattened cost list of an alternative this payment belongs to (G19). */
  | { k: 'pay'; cost: Cost; list?: readonly Cost[]; at?: number }
  /**
   * "A or B" costs (G19): choose among the alternatives that can be paid (`alts`, each the whole
   * cost list with that alternative in place), then jump to its payments (`to`).
   */
  | { k: 'alt'; alts: Cost[][]; to: number[] }
  /** Costs are paid: the effect proper starts here (CR 8-4-1 (4)). */
  | { k: 'paid' }
  /** `label`: "if you do" can read whether this action did something (OP08-098). */
  | { k: 'do'; a: EffectAction; label?: string }
  | { k: 'op'; a: InternalStep }
  /** Jump to `to` unless the condition holds. */
  | { k: 'jf'; c: Condition; to: number }
  | { k: 'jmp'; to: number }
  /** Ask the controller; on "no" jump to `to`; on "yes" record `label` as done. */
  | { k: 'may'; label: string; prompt?: string; to: number }
  /** Ask `chooser` for a mode, then jump to that mode's code. */
  | { k: 'mode'; chooser: P; labels: string[]; neutral?: string[]; to: number[] }
  /** Register a delayed body starting at the next instruction; continue at `to`. */
  | { k: 'delay'; to: number; at?: 'startOfOpponentsNextMainPhase' }
  /** `forEach`: count `n` now; run the body that many times, or jump to `to` for none. */
  | { k: 'fe'; n: Num; to: number }
  /** End of a `forEach` body: run it again (from `start`) while runs are left. */
  | { k: 'feEnd'; start: number }
  | { k: 'end' };

const cache = new WeakMap<object, Instr[]>();

export function program(ab: Ability, part: 'effect' | 'instead'): Instr[] {
  const key: object =
    part === 'instead' && ab.kind === 'replacement' ? ab.instead : (ab as unknown as object);
  let prog = cache.get(key);
  if (!prog) {
    prog = build(ab, part);
    cache.set(key, prog);
  }
  return prog;
}

function build(ab: Ability, part: 'effect' | 'instead'): Instr[] {
  const out: Instr[] = [];
  if (part === 'instead') {
    if (ab.kind !== 'replacement') return [{ k: 'end' }];
    const list = ab.instead as unknown[];
    if (list.some(isInternal) || isEffect(list)) steps(out, list as EStep[]);
    else for (const c of list as Cost[]) out.push({ k: 'pay', cost: c });
    out.push({ k: 'paid' }, { k: 'end' });
    return out;
  }
  if (ab.kind === 'permanent' || ab.kind === 'replacement') return [{ k: 'end' }];
  const cost = ab.cost ?? [];
  const at = cost.findIndex((c) => 'oneOf' in c);
  if (at < 0) for (const c of cost) out.push({ k: 'pay', cost: c });
  else {
    // The choice comes first; each alternative then has its own straight list of payments, so
    // the DON!! a later cost needs are reserved from the costs that really follow (G19).
    const alts = (cost[at] as Extract<Cost, { oneOf: unknown }>).oneOf.map((a) => [
      ...cost.slice(0, at),
      ...a,
      ...cost.slice(at + 1),
    ]);
    const alt: Instr = { k: 'alt', alts, to: [] };
    out.push(alt);
    const ends: Instr[] = [];
    for (const list of alts) {
      alt.to.push(out.length);
      list.forEach((c, i) => out.push({ k: 'pay', cost: c, list, at: i }));
      const j: Instr = { k: 'jmp', to: -1 };
      out.push(j);
      ends.push(j);
    }
    for (const j of ends) if (j.k === 'jmp') j.to = out.length;
  }
  out.push({ k: 'paid' });
  steps(out, ab.effect);
  out.push({ k: 'end' });
  return out;
}

function steps(out: Instr[], list: readonly EStep[]): void {
  for (const st of list) step(out, st);
}

function step(out: Instr[], st: EStep): void {
  if (isInternal(st)) {
    out.push({ k: 'op', a: st });
    return;
  }
  if ('do' in st && !('forEach' in st) && !('delayed' in st)) {
    const i: Instr = { k: 'do', a: st.do };
    if ('label' in st && st.label) i.label = st.label;
    out.push(i);
    return;
  }
  if ('if' in st) {
    const jf: Instr = { k: 'jf', c: st.if, to: -1 };
    out.push(jf);
    steps(out, st.then);
    if (st.else) {
      const jmp: Instr = { k: 'jmp', to: -1 };
      out.push(jmp);
      jf.to = out.length;
      steps(out, st.else);
      jmp.to = out.length;
    } else {
      jf.to = out.length;
    }
    return;
  }
  if ('may' in st) {
    const m: Instr = { k: 'may', label: st.label, to: -1 };
    if (st.prompt) m.prompt = st.prompt;
    out.push(m);
    steps(out, st.may);
    m.to = out.length;
    return;
  }
  if ('ifDid' in st) {
    const jf: Instr = { k: 'jf', c: { did: st.ifDid }, to: -1 };
    out.push(jf);
    steps(out, st.then);
    jf.to = out.length;
    return;
  }
  if ('chooseOne' in st) {
    const m: Instr = { k: 'mode', chooser: st.chooser ?? 'you', labels: st.labels, to: [] };
    if (st.neutral) m.neutral = st.neutral;
    out.push(m);
    const ends: Instr[] = [];
    for (const mode of st.chooseOne) {
      m.to.push(out.length);
      steps(out, mode);
      const j: Instr = { k: 'jmp', to: -1 };
      out.push(j);
      ends.push(j);
    }
    for (const j of ends) if (j.k === 'jmp') j.to = out.length;
    return;
  }
  if ('forEach' in st) {
    const fe: Instr = { k: 'fe', n: st.forEach, to: -1 };
    out.push(fe);
    const start = out.length;
    steps(out, st.do);
    out.push({ k: 'feEnd', start });
    fe.to = out.length;
    return;
  }
  if ('delayed' in st) {
    const d: Instr = { k: 'delay', to: -1 };
    if (st.delayed.at === 'startOfOpponentsNextMainPhase') d.at = st.delayed.at;
    out.push(d);
    steps(out, st.do);
    out.push({ k: 'end' });
    d.to = out.length;
    return;
  }
  throw new Error(`Step not implemented: ${JSON.stringify(st)}`);
}
