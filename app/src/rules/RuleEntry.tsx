import { StubPage } from '../routes/Stub.tsx';

/** M9 WP0 stub: the owning package replaces this page. */
export default function RuleEntryRoute({ path }: { path: string }) {
  return <StubPage title="Rule" note="WP5 builds the rule page here." path={path} />;
}
