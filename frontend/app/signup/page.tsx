'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, User, Mail, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useUser } from '@/app/context/user-context';

interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: { id: number; username: string; email: string; role: string };
}

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useUser();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const data = await api.post<RegisterResponse>('/auth/register', { username, email, password });
      setToken(data.access_token);
      setUser(data.user);
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-card rounded-3xl p-8 border-2 border-card shadow-lg">
          <div className="flex justify-center mb-8">
            <img
              src="/bean.svg"
              alt="Bean mascot"
              className="w-32 h-32 object-contain"
            />
          </div>

          <h1 className="text-4xl font-bold text-card-foreground text-center mb-2">
            Sign Up
          </h1>
          <p className="text-center text-card-foreground opacity-75 mb-8">
            Create your account to get started
          </p>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3 mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-card-foreground font-medium mb-3">
                username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                <Input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-12 bg-input text-foreground border-2 border-border rounded-full py-3 focus:border-accent focus:ring-2 focus:ring-accent/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-card-foreground font-medium mb-3">
                email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 bg-input text-foreground border-2 border-border rounded-full py-3 focus:border-accent focus:ring-2 focus:ring-accent/30"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-card-foreground font-medium mb-3">
                password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 bg-input text-foreground border-2 border-border rounded-full py-3 focus:border-accent focus:ring-2 focus:ring-accent/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-card-foreground font-medium mb-3">
                confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 pr-12 bg-input text-foreground border-2 border-border rounded-full py-3 focus:border-accent focus:ring-2 focus:ring-accent/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-foreground hover:bg-accent/90 disabled:opacity-50 rounded-full py-3 font-bold text-lg transition-all duration-300"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-card-foreground/70 mt-6">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-accent font-semibold hover:underline transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
