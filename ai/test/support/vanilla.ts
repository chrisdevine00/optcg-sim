/**
 * Some lethal-solver tests were written (M4a) with cards that were then unscripted as plain
 * fixtures: a 5000 Leader, a 7000 vanilla, a 7000 [Double Attack] vanilla. M4b scripts those cards,
 * which changes what the solver and its bound see. A test file that needs the plain fixture calls
 * `asVanilla(id, ...)` before building any game: the script is removed for that test file only
 * (vitest isolates each file's modules), so the test keeps pinning what it was written to pin.
 */
import { SCRIPTS } from '@optcg/cards';

export function asVanilla(...ids: string[]): void {
  const scripts = SCRIPTS as Record<string, unknown>;
  for (const id of ids) Reflect.deleteProperty(scripts, id);
}
