import { StubPage } from '../routes/Stub.tsx';

/** M9 WP0 stub: the owning package replaces this page. */
export default function RulesRoute({ path }: { path: string }) {
  return (
    <StubPage title="Rules reference" note="WP5 builds the search and index here." path={path} />
  );
}
