'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login - in a real app, this would verify credentials
    setTimeout(() => {
      router.push('/home');
      setIsLoading(false);
    }, 500);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Card */}
        <div className="bg-card rounded-3xl p-8 border-2 border-card shadow-lg">
          {/* Welcome Illustration */}
          <div className="flex justify-center mb-8">
            <img
              src="/welcome-bean.svg"
              alt="Bean mascot"
              className="w-32 h-32 object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-card-foreground text-center mb-2">
            Login
          </h1>
          <p className="text-center text-card-foreground opacity-75 mb-8">
            Access your secure files
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-card-foreground font-medium mb-3">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-12 bg-input text-foreground placeholder:text-foreground/40 border-border rounded-full focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-card-foreground font-medium mb-3">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 bg-input text-foreground placeholder:text-foreground/40 border-border rounded-full focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPassword ? '👁' : '⌣'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-accent text-foreground hover:bg-accent/90 rounded-full py-6 font-bold text-lg transition-all duration-300 hover:shadow-lg disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Submit'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <span className="text-card-foreground opacity-75">New here? </span>
            <button
              onClick={() => router.push('/signup')}
              className="text-accent font-bold hover:underline transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
