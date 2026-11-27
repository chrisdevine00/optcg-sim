import { StubPage } from '../routes/Stub.tsx';

/** M9 WP0 stub: the owning package replaces this page. */
export default function DrillStart({ path }: { path: string }) {
  return <StubPage title="Start a drill" note="WP4 builds the start screen here." path={path} />;
}
