import { StubPage } from '../routes/Stub.tsx';

/** M9 WP0 stub: the owning package replaces this page. */
export default function GuideRoute({ path }: { path: string }) {
  return <StubPage title="Archetype guide" note="WP1 builds the guide page here." path={path} />;
}
