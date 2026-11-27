import { StubPage } from '../routes/Stub.tsx';

/** M9 WP0 stub: the owning package replaces this page. */
export default function DrillRun({ path }: { path: string }) {
  return <StubPage title="Drill" note="WP4 builds the item screens here." path={path} full />;
}
