'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { useUser } from '@/app/context/user-context';
import { Upload, FileText, Globe } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useUser();

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-foreground/60">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-3xl w-full animate-in fade-in duration-500">
          <div className="mb-12 flex justify-center">
            <img
              src="/welcome-bean.svg"
              alt="Welcome Bean mascot"
              className="w-56 h-56 object-contain"
              style={{ animation: 'float 3s ease-in-out infinite' }}
            />
          </div>

          <div className="mb-12 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-2">
              Greetings, {user?.username || 'User'}
            </h2>
            <p className="text-lg text-foreground/60">Manage your secure files with ease</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8" style={{ perspective: '1000px' }}>
            <div
              onClick={() => router.push('/upload')}
              className="group relative bg-gradient-to-br from-card to-card/80 rounded-3xl p-4 cursor-pointer border-2 border-card hover:border-accent overflow-hidden transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 group-hover:shadow-2xl transition-shadow duration-500"
                style={{ boxShadow: '0 20px 60px rgba(184, 134, 11, 0.15)', transform: 'translateY(-4px)' }}>
              </div>
              <div className="relative flex flex-col items-center justify-center gap-2 z-10 pb-2">
                <div className="relative w-16 h-16 flex items-center justify-center group/icon">
                  <div className="absolute inset-0 bg-accent opacity-10 rounded-full blur-xl group-hover/icon:scale-125 transition-transform duration-500" style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}></div>
                  <Upload className="w-8 h-8 text-accent relative z-10 transition-all duration-300 group-hover/icon:scale-125 group-hover/icon:rotate-12" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground text-center transition-all duration-300 group-hover:scale-110">
                  Upload a file
                </h3>
                <p className="text-xs text-card-foreground/70 text-center group-hover:text-card-foreground/90 transition-colors duration-300">
                  Share and secure your files
                </p>
              </div>
            </div>

            <div
              onClick={() => router.push('/dashboard')}
              className="group relative bg-gradient-to-br from-card to-card/80 rounded-3xl p-4 cursor-pointer border-2 border-card hover:border-accent overflow-hidden transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 group-hover:shadow-2xl transition-shadow duration-500"
                style={{ boxShadow: '0 20px 60px rgba(184, 134, 11, 0.15)', transform: 'translateY(-4px)' }}>
              </div>
              <div className="relative flex flex-col items-center justify-center gap-2 z-10 pb-2">
                <div className="relative w-16 h-16 flex items-center justify-center group/icon">
                  <div className="absolute inset-0 bg-accent opacity-10 rounded-full blur-xl group-hover/icon:scale-125 transition-transform duration-500" style={{ animation: 'glow-pulse 2s ease-in-out infinite', animationDelay: '0.5s' }}></div>
                  <FileText className="w-8 h-8 text-accent relative z-10 transition-all duration-300 group-hover/icon:scale-125 group-hover/icon:-rotate-12" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground text-center transition-all duration-300 group-hover:scale-110">
                  Review files
                </h3>
                <p className="text-xs text-card-foreground/70 text-center group-hover:text-card-foreground/90 transition-colors duration-300">
                  View and manage uploads
                </p>
              </div>
            </div>

            <div
              onClick={() => router.push('/discover')}
              className="group relative bg-gradient-to-br from-card to-card/80 rounded-3xl p-4 cursor-pointer border-2 border-card hover:border-accent overflow-hidden transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 group-hover:shadow-2xl transition-shadow duration-500"
                style={{ boxShadow: '0 20px 60px rgba(184, 134, 11, 0.15)', transform: 'translateY(-4px)' }}>
              </div>
              <div className="relative flex flex-col items-center justify-center gap-2 z-10 pb-2">
                <div className="relative w-16 h-16 flex items-center justify-center group/icon">
                  <div className="absolute inset-0 bg-accent opacity-10 rounded-full blur-xl group-hover/icon:scale-125 transition-transform duration-500" style={{ animation: 'glow-pulse 2s ease-in-out infinite', animationDelay: '1s' }}></div>
                  <Globe className="w-8 h-8 text-accent relative z-10 transition-all duration-300 group-hover/icon:scale-125 group-hover/icon:rotate-12" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground text-center transition-all duration-300 group-hover:scale-110">
                  Discover files
                </h3>
                <p className="text-xs text-card-foreground/70 text-center group-hover:text-card-foreground/90 transition-colors duration-300">
                  Explore shared files
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
