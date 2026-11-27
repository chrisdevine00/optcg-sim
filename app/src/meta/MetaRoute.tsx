import { StubPage } from '../routes/Stub.tsx';

/** M9 WP0 stub: the owning package replaces this page. */
export default function MetaRoute({ path }: { path: string }) {
  return <StubPage title="Meta Explorer" note="WP1 builds the tiles here." path={path} />;
}
