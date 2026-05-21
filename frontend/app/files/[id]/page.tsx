'use client';

import { useState } from 'react';
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

interface FileDetails {
  id: string;
  name: string;
  description: string;
  size: string;
  type: string;
  uploadedAt: string;
  isPublic: boolean;
  hasPassword: boolean;
}

// Mock data
const mockFile: FileDetails = {
  id: '1',
  name: 'presentation.pdf',
  description: 'Q4 business presentation and analytics',
  size: '2.5 MB',
  type: 'PDF',
  uploadedAt: '2 hours ago',
  isPublic: false,
  hasPassword: true,
};

export default function FileDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [file, setFile] = useState<FileDetails>(mockFile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(file.name);
  const [editedDescription, setEditedDescription] = useState(file.description);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setFile({
        ...file,
        name: editedName,
        description: editedDescription,
      });
      setIsSaving(false);
    }, 500);
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    router.push('/dashboard');
  };

  const handleDownload = () => {
    // Simulate download
    console.log('Downloading:', file.name);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (!newPassword) {
      alert('Password cannot be empty');
      return;
    }

    isSaving ? null : setIsSaving(true);
    setTimeout(() => {
      setFile({ ...file, hasPassword: true });
      setIsSaving(false);
      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
      alert('Password updated successfully');
    }, 500);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header showBack title={file.name} />

      <div className="flex-1 flex flex-col p-8">
        <div className="max-w-2xl w-full mx-auto">
          {/* File Details Card */}
          <div className="bg-card rounded-3xl p-8 border-2 border-card shadow-lg space-y-6">
            {/* File Name Input */}
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

            {/* Description Textarea */}
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

            {/* File Info - More Prominent */}
            <div className="bg-gradient-to-br from-accent/15 to-accent/5 rounded-2xl p-6 space-y-4 border border-accent/20">
              <h3 className="text-card-foreground font-bold text-lg mb-4">File Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-card-foreground/60 font-semibold uppercase tracking-wide">File Size</p>
                  <p className="text-lg font-bold text-card-foreground">{file.size}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-card-foreground/60 font-semibold uppercase tracking-wide">File Type</p>
                  <p className="text-lg font-bold text-card-foreground">{file.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-card-foreground/60 font-semibold uppercase tracking-wide">Uploaded</p>
                  <p className="text-lg font-bold text-card-foreground">{file.uploadedAt}</p>
                </div>
              </div>
            </div>

            {/* Access Control */}
            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-card-foreground font-semibold">Public Access</p>
                    <p className="text-xs text-card-foreground/60">
                      {file.isPublic ? 'Anyone with the link can access' : 'File is private - only you can access'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={file.isPublic}
                  onCheckedChange={(checked) =>
                    setFile({ ...file, isPublic: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-card-foreground font-semibold">Password Protection</p>
                    <p className="text-xs text-card-foreground/60">
                      {file.hasPassword ? 'File is password protected' : 'No password set'}
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

            {/* Action Buttons */}
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

      {/* Change Password Dialog */}
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
            {/* New Password Field */}
            <div>
              <label className="block text-card-foreground font-medium mb-2 text-sm">
                New Password
              </label>
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

            {/* Confirm Password Field */}
            <div>
              <label className="block text-card-foreground font-medium mb-2 text-sm">
                Confirm Password
              </label>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-2 border-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground text-xl">
              Delete file?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-card-foreground/70">
              This action cannot be undone. Are you sure you want to delete{' '}
              <span className="font-bold">{file.name}</span>?
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
