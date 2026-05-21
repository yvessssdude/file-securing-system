'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Lock, FileText, Mail, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '@/app/context/user-context';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, loading } = useUser();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user, loading, router]);

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    try {
      const updated = await api.put<{ id: number; username: string; email: string; role: string }>('/auth/me', { username, email });
      setUser(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!currentPassword || !newPassword) {
      setError('Please fill in all password fields');
      return;
    }
    setIsSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password changed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setIsSaving(false);
    }
  };

  const publicFilesCount = 5;
  const privateFilesCount = 8;
  const totalFilesCount = publicFilesCount + privateFilesCount;

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Header showBack title="Bean" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-foreground/60">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header showBack title="Bean" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full animate-in fade-in duration-500">
          <div className="bg-card rounded-3xl p-8 border-2 border-card shadow-lg mb-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full bg-accent/20 border-4 border-accent flex items-center justify-center mb-4">
                <UserIcon className="w-12 h-12 text-accent" />
              </div>
              <h1 className="text-3xl font-bold text-card-foreground mb-2">
                {username}
              </h1>
              <p className="text-card-foreground/60">{email}</p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3 mb-4 text-center">
                {error}
              </div>
            )}

            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-input text-foreground hover:bg-muted rounded-full py-3 font-bold"
              >
                Edit Profile
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-card-foreground font-semibold mb-2">Username</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full bg-input text-foreground border-border rounded-full px-6 py-3 focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </div>

                <div>
                  <label className="block text-card-foreground font-semibold mb-2">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-input text-foreground border-border rounded-full px-6 py-3 focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-foreground/10 text-card-foreground hover:bg-foreground/20 rounded-full py-3 font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-accent text-foreground hover:bg-accent/90 rounded-full py-3 font-bold"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>

                <div className="mt-4">
                  <Button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="w-full bg-card border-2 border-border text-card-foreground hover:border-accent rounded-full py-3 font-bold"
                  >
                    {showPasswordChange ? 'Hide Password Change' : 'Change Password'}
                  </Button>
                </div>

                {showPasswordChange && (
                  <div className="mt-4 p-4 bg-foreground/5 rounded-2xl space-y-3">
                    <div>
                      <label className="block text-card-foreground font-semibold mb-2 text-sm">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full pl-10 pr-10 bg-input text-foreground border-2 border-border rounded-full py-2 focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground text-sm"
                        >
                          {showCurrentPassword ? '👁' : '⌣'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-card-foreground font-semibold mb-2 text-sm">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full pl-10 pr-10 bg-input text-foreground border-2 border-border rounded-full py-2 focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground text-sm"
                        >
                          {showNewPassword ? '👁' : '⌣'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-card-foreground font-semibold mb-2 text-sm">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full pl-10 pr-10 bg-input text-foreground border-2 border-border rounded-full py-2 focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground text-sm"
                        >
                          {showConfirmPassword ? '👁' : '⌣'}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => setShowPasswordChange(false)}
                        className="flex-1 bg-foreground/10 text-card-foreground hover:bg-foreground/20 rounded-full py-2 font-bold text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleChangePassword}
                        disabled={isSaving}
                        className="flex-1 bg-accent text-foreground hover:bg-accent/90 rounded-full py-2 font-bold text-sm"
                      >
                        {isSaving ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-card rounded-3xl p-8 border-2 border-card shadow-lg">
            <h2 className="text-2xl font-bold text-card-foreground mb-6">
              Upload Statistics
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-foreground/5 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <p className="text-3xl font-bold text-card-foreground mb-1">{totalFilesCount}</p>
                <p className="text-sm text-card-foreground/80">Total Files</p>
              </div>

              <div className="bg-foreground/5 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-accent" />
                </div>
                <p className="text-3xl font-bold text-card-foreground mb-1">{publicFilesCount}</p>
                <p className="text-sm text-card-foreground/80">Public Files</p>
              </div>

              <div className="bg-foreground/5 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-accent" />
                </div>
                <p className="text-3xl font-bold text-card-foreground mb-1">{privateFilesCount}</p>
                <p className="text-sm text-card-foreground/80">Private Files</p>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-8">
              <h3 className="text-lg font-bold text-card-foreground mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-card-foreground/70">Username:</span>
                  <span className="font-semibold text-card-foreground">{user.username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-card-foreground/70">Email:</span>
                  <span className="font-semibold text-card-foreground">{user.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-card-foreground/70">Role:</span>
                  <span className="font-semibold text-card-foreground">{user.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
