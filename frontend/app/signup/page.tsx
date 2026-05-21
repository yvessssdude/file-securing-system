'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, User, Mail, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsLoading(true);

    // Simulate signup - in a real app, this would create an account
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
              src="/bean.svg"
              alt="Bean mascot"
              className="w-32 h-32 object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-card-foreground text-center mb-2">
            Sign Up
          </h1>
          <p className="text-center text-card-foreground opacity-75 mb-8">
            Create your account to get started
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
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

            {/* Email Field */}
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

            {/* Password Field */}
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

            {/* Confirm Password Field */}
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-foreground hover:bg-accent/90 disabled:opacity-50 rounded-full py-3 font-bold text-lg transition-all duration-300"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Sign In Link */}
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
