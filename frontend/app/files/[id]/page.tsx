'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, Lock, Globe, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface FileDetails {
  id: number;
  original_filename: string;
  description: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  is_public: boolean;
  has_password: boolean;
}

export default function FileDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [file, setFile] = useState<FileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedIsPublic, setEditedIsPublic] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingSave, setPendingSave] = useState(false);
  const [showPrivatePasswordDialog, setShowPrivatePasswordDialog] = useState(false);
  const [privatePassword, setPrivatePassword] = useState('');
  const [privateConfirmPassword, setPrivateConfirmPassword] = useState('');

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const data = await api.get<FileDetails>(`/files/${params.id}`);
        setFile(data);
        setEditedName(data.original_filename);
        setEditedDescription(data.description || '');
        setEditedIsPublic(data.is_public);
      } catch {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchFile();
  }, [params.id, router]);

  const handleSave = async () => {
    if (!editedIsPublic && !file?.has_password && !privatePassword) {
      setShowPrivatePasswordDialog(true);
      return;
    }
    await doSave();
  };

  const doSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const data = await api.put<FileDetails>(`/files/${params.id}`, {
        filename: editedName,
        description: editedDescription,
        isPublic: editedIsPublic,
      });
      setFile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const validatePassword = (pw: string) => {
    const rx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return rx.test(pw);
  };

  const handlePrivatePasswordSave = async () => {
    if (privatePassword !== privateConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!privatePassword) {
      setError('Password cannot be empty');
      return;
    }
    if (!validatePassword(privatePassword)) {
      setError('Password must contain at least 8 characters, an uppercase char, lowercase char, number, and symbol');
      return;
    }
    setIsSaving(true);
    try {
      await api.put(`/files/${params.id}/password`, {
        newPassword: privatePassword,
        confirmPassword: privateConfirmPassword,
      });
      setShowPrivatePasswordDialog(false);
      setPrivatePassword('');
      setPrivateConfirmPassword('');
      await doSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    try {
      await api.delete(`/files/${params.id}`);
      router.push('/dashboard');
    } catch {
      // handled
    }
  };

  const handleDownload = async () => {
    try {
      const token = getToken();
      const res = await fetch(`/api/files/${params.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file?.original_filename || 'download';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!newPassword) {
      alert('Password cannot be empty');
      return;
    }
    if (!validatePassword(newPassword)) {
      alert('Password must contain at least 8 characters, an uppercase char, lowercase char, number, and symbol');
      return;
    }

    setIsSaving(true);
    try {
      await api.put(`/files/${params.id}/password`, {
        newPassword,
        confirmPassword,
      });
      setFile(prev => prev ? { ...prev, has_password: true } : prev);
      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
      alert('Password updated successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !file) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Header showBack title="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-foreground/60">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header showBack title={file.original_filename} />

      <div className="flex-1 flex flex-col p-8">
        <div className="max-w-2xl w-full mx-auto">
          <div className="bg-card rounded-3xl p-8 border-2 border-card shadow-lg space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-card-foreground font-semibold mb-3">
                File name:
              </label>
              <Input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full bg-input text-foreground border-border rounded-full px-6 py-3 focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </div>

            <div>
              <label className="block text-card-foreground font-semibold mb-3">
                Description:
              </label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full bg-input text-foreground border-2 border-border rounded-2xl px-6 py-4 placeholder:text-foreground/40 focus:border-accent focus:ring-2 focus:ring-accent/30 resize-none min-h-24"
              />
            </div>

            <div className="bg-gradient-to-br from-accent/15 to-accent/5 rounded-2xl p-6 space-y-4 border border-accent/20">
              <h3 className="text-card-foreground font-bold text-lg mb-4">File Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-card-foreground/60 font-semibold uppercase tracking-wide">File Size</p>
                  <p className="text-lg font-bold text-card-foreground">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-card-foreground/60 font-semibold uppercase tracking-wide">File Type</p>
                  <p className="text-lg font-bold text-card-foreground">{file.mime_type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-card-foreground/60 font-semibold uppercase tracking-wide">Uploaded</p>
                  <p className="text-lg font-bold text-card-foreground">{new Date(file.uploaded_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <div className="bg-foreground/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-accent" />
                    <span className="text-card-foreground font-semibold">Public Access</span>
                  </div>
                  <Switch
                    checked={editedIsPublic}
                    onCheckedChange={setEditedIsPublic}
                    className="bg-accent/30 data-[state=checked]:bg-accent"
                  />
                </div>
                <p className="text-xs text-card-foreground/60 ml-8">
                  {editedIsPublic
                    ? 'Anyone can download without a password'
                    : 'Password required to download'}
                </p>
              </div>

              <div className="bg-foreground/5 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-card-foreground font-semibold">Password Protection</p>
                      <p className="text-xs text-card-foreground/60">
                        {file.has_password ? 'File is password protected' : 'No password set'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordDialog(true)}
                    className="px-4 py-2 rounded-full bg-accent hover:bg-accent/90 text-foreground font-semibold text-sm transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-6">
              <Button
                onClick={handleDownload}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-4 font-bold text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Download className="w-5 h-5" />
                Download File
              </Button>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-foreground rounded-full py-4 font-bold text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </Button>

              <Button
                onClick={() => setShowDeleteDialog(true)}
                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full py-4 font-bold text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Trash2 className="w-5 h-5" />
                Delete File
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showPrivatePasswordDialog} onOpenChange={setShowPrivatePasswordDialog}>
        <AlertDialogContent className="bg-card border-2 border-card max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground text-xl">
              Password Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-card-foreground/70">
              This file is set to private. Set a password to protect it.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 my-4">
            <div>
              <label className="block text-card-foreground font-medium mb-2 text-sm">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={privatePassword}
                  onChange={(e) => setPrivatePassword(e.target.value)}
                  className="pl-10 bg-input text-foreground border-2 border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/30"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-card-foreground font-medium mb-2 text-sm">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={privateConfirmPassword}
                  onChange={(e) => setPrivateConfirmPassword(e.target.value)}
                  className="pl-10 bg-input text-foreground border-2 border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <AlertDialogCancel className="bg-input text-foreground hover:bg-muted border-0 rounded-full px-6 py-2 font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePrivatePasswordSave}
              className="bg-accent text-foreground hover:bg-accent/90 border-0 rounded-full px-6 py-2 font-bold"
            >
              Set Password & Save
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent className="bg-card border-2 border-card max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground text-xl">
              Change File Password
            </AlertDialogTitle>
            <AlertDialogDescription className="text-card-foreground/70">
              Set or update the password to protect this file
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 my-4">
            <div>
              <label className="block text-card-foreground font-medium mb-2 text-sm">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 bg-input text-foreground border-2 border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-card-foreground font-medium mb-2 text-sm">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 bg-input text-foreground border-2 border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <AlertDialogCancel className="bg-input text-foreground hover:bg-muted border-0 rounded-full px-6 py-2 font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangePassword}
              className="bg-accent text-foreground hover:bg-accent/90 border-0 rounded-full px-6 py-2 font-bold"
            >
              {isSaving ? 'Updating...' : 'Update Password'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-2 border-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground text-xl">
              Delete file?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-card-foreground/70">
              This action cannot be undone. Are you sure you want to delete{' '}
              <span className="font-bold">{file.original_filename}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-input text-foreground hover:bg-muted border-0 rounded-full px-6 py-2 font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80 border-0 rounded-full px-6 py-2 font-bold"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
