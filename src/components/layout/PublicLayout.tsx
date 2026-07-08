import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { SoundToggle } from '@/components/SoundToggle';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col w-full">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <SoundToggle />
    </div>
  );
}
