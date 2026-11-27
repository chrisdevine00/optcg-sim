/** A script step as data: the four texts `Pass.step` records, so the listening sheet is generated from them. */
export interface StepDef {
  id: string;
  title: string;
  do: string;
  expect: string;
}

/** The four leading arguments of `Pass.step` for the step with this id. Throws on an unknown id. */
export function stepArgs(table: readonly StepDef[], id: string): [string, string, string, string] {
  const s = table.find((d) => d.id === id);
  if (!s) throw new Error(`No step "${id}" in the table`);
  return [s.id, s.title, s.do, s.expect];
}
