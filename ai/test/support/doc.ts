/** The example `Explanation` objects written in docs/design/explanations.md, read from the doc itself. */
import { readFileSync } from 'node:fs';
import type { Explanation } from '../../src/index.ts';

export function docExample(id: string): Explanation {
  const md = readFileSync(new URL('../../../docs/design/explanations.md', import.meta.url), 'utf8');
  const at = md.indexOf(`## ${id}.`);
  const block = /```ts\n([\s\S]*?)```/.exec(md.slice(at))![1]!;
  return new Function(`return (${block});`)() as Explanation;
}
