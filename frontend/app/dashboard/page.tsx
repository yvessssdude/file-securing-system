'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, FileText } from 'lucide-react';
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

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/files/${id}`);
      setFiles(files.filter(f => f.id !== id));
    } catch {
      // handled
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
                className="bg-input text-foreground hover:bg-muted rounded-full px-8 py-3 font-bold"
              >
                Upload a file
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group bg-card rounded-2xl p-6 flex items-center justify-between border-2 border-card hover:border-accent hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-card-foreground truncate">
                        {file.original_filename}
                      </h3>
                      <p className="text-sm text-card-foreground/60">
                        {(file.file_size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0 ml-4">
                    <Button
                      onClick={() => router.push(`/files/${file.id}`)}
                      className="bg-input text-foreground hover:bg-muted rounded-full px-6 py-2 text-sm font-bold"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      onClick={() => handleDelete(file.id)}
                      variant="destructive"
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded-full px-6 py-2 text-sm font-bold"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
