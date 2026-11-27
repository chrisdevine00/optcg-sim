import { StubPage } from '../routes/Stub.tsx';

/** M9 WP0 stub: the owning package replaces this page. */
export default function DrillsHome({ path }: { path: string }) {
  return <StubPage title="Drills" note="WP4 builds the drill list here." path={path} />;
}
