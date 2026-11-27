import { StubPage } from '../routes/Stub.tsx';

/** M9 WP0 stub: the owning package replaces this page. */
export default function ProgressRoute({ path }: { path: string }) {
  return <StubPage title="Progress" note="WP6 builds the progress page here." path={path} />;
}
