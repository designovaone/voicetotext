import { isAuthed } from '@/lib/auth';
import UnlockScreen from '@/components/UnlockScreen';
import MainShell from '@/components/MainShell';

export default async function Home() {
  const authed = await isAuthed();
  if (!authed) return <UnlockScreen />;
  return <MainShell />;
}
