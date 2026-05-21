'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, FileText } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/api';

interface FileItem {
  id: number;
  original_filename: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  const fetchFiles = async () => {
    try {
      const data = await api.get<FileItem[]>('/files');
      setFiles(data);
    } catch {
      // handled by api.ts redirect
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/files/${deleteTarget.id}`);
      setFiles(files.filter(f => f.id !== deleteTarget.id));
    } catch {
      // handled
    } finally {
      setDeleteTarget(null);
    }
  };

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

  const isEmpty = files.length === 0;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header showBack title="Review uploaded file" />

      <div className="flex-1 flex flex-col p-8">
        <div className="max-w-4xl w-full mx-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-20">
              <img
                src="/review-bean.svg"
                alt="Bean mascot"
                className="w-24 h-24 mb-6 opacity-40"
              />
              <h2 className="text-3xl font-bold text-foreground mb-2">
                No files yet
              </h2>
              <p className="text-foreground/60 mb-8">
                Start by uploading your first file
              </p>
              <Button
                onClick={() => router.push('/upload')}
                className="bg-accent text-foreground hover:bg-accent/90 rounded-full px-10 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Upload a file
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => router.push(`/files/${file.id}`)}
                  className="group bg-card rounded-2xl p-6 flex items-center justify-between border-2 border-card hover:border-accent hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-card-foreground truncate group-hover:text-accent transition-colors duration-300">
                        {file.original_filename}
                      </h3>
                      <p className="text-sm text-card-foreground/60">
                        {(file.file_size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0 ml-4">
                    <Button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(file); }}
                      variant="destructive"
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded-full px-6 py-2 text-sm font-bold"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-card border-2 border-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground text-xl">
              Delete file?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-card-foreground/70">
              This action cannot be undone. Are you sure you want to delete{' '}
              <span className="font-bold">{deleteTarget?.original_filename}</span>?
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
