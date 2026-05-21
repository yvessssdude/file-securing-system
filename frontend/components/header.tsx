'use client';

import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { removeToken } from '@/lib/auth';

export function Header() {
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const handleBeanClick = () => {
    router.push('/home');
  };

  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card to-card opacity-100"></div>

      <div className="absolute top-0 left-0 w-96 h-96 bg-accent opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent opacity-5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>

      <div className="relative flex items-center justify-between px-8 py-6 z-10">
        <div className="relative cursor-pointer" onClick={handleBeanClick}>
          <h1 className="text-3xl font-bold text-card-foreground tracking-tight animate-slide-in-from-left hover:text-accent transition-colors duration-300">
            Bean
          </h1>
          <div className="absolute -bottom-1 left-0 h-1 bg-gradient-to-r from-accent to-transparent w-12 rounded-full" style={{
            animation: 'gradient-shift 3s ease-in-out infinite'
          }}></div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/profile')}
            className="group relative p-3 text-card-foreground transition-all duration-300"
            title="Profile"
          >
            <div className="absolute inset-0 bg-accent/15 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
            <User className="w-5 h-5 relative z-10 transition-all duration-300 group-hover:text-accent group-hover:scale-110" style={{
              animation: 'icon-bounce'
            }} />
          </button>

          <div className="w-px h-6 bg-border/50 mx-1"></div>

          <button
            onClick={handleLogout}
            className="group relative p-3 text-card-foreground transition-all duration-300"
            title="Logout"
          >
            <div className="absolute inset-0 bg-destructive/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
            <LogOut className="w-5 h-5 relative z-10 transition-all duration-300 group-hover:text-destructive group-hover:scale-110" style={{
              animation: 'icon-bounce',
              animationDelay: '0.1s'
            }} />
          </button>
        </div>
      </div>
    </header>
  );
}
